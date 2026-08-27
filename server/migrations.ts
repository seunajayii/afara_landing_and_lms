import { sql } from "drizzle-orm";
import { db } from "./db";
import { log } from "./vite";

export async function runSchemaMigrations() {
  try {
    await db.execute(sql`
      ALTER TABLE applications
        ADD COLUMN IF NOT EXISTS registration_proof_url TEXT,
        ADD COLUMN IF NOT EXISTS financial_statements_url TEXT,
        ADD COLUMN IF NOT EXISTS last_draft_email_sent_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS resume_token TEXT DEFAULT gen_random_uuid()
    `);
    // Add disqualified status to the enum (safe — only adds, never removes)
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'disqualified'
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'application_status')
        ) THEN
          ALTER TYPE application_status ADD VALUE 'disqualified';
        END IF;
      END
      $$;
    `);
    // Reusable cohort architecture: type/status enums + richer cohort columns
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cohort_type') THEN
          CREATE TYPE cohort_type AS ENUM ('core', 'sponsored');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cohort_status') THEN
          CREATE TYPE cohort_status AS ENUM ('draft', 'open', 'closed', 'archived');
        END IF;
      END
      $$;
    `);
    await db.execute(sql`
      ALTER TABLE cohorts
        ADD COLUMN IF NOT EXISTS display_name TEXT,
        ADD COLUMN IF NOT EXISTS slug TEXT,
        ADD COLUMN IF NOT EXISTS version TEXT,
        ADD COLUMN IF NOT EXISTS series_key TEXT,
        ADD COLUMN IF NOT EXISTS cohort_type cohort_type NOT NULL DEFAULT 'core',
        ADD COLUMN IF NOT EXISTS status cohort_status NOT NULL DEFAULT 'draft',
        ADD COLUMN IF NOT EXISTS tagline TEXT,
        ADD COLUMN IF NOT EXISTS partnership_note TEXT,
        ADD COLUMN IF NOT EXISTS sponsor TEXT,
        ADD COLUMN IF NOT EXISTS geography TEXT,
        ADD COLUMN IF NOT EXISTS sector TEXT,
        ADD COLUMN IF NOT EXISTS logo_url TEXT,
        ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
        ADD COLUMN IF NOT EXISTS eligibility_criteria TEXT,
        ADD COLUMN IF NOT EXISTS application_open_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS application_close_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS program_start_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS program_end_at TIMESTAMP
    `);
    // Per-cohort custom application questions (admin-defined) and the
    // applicant's answers to them. Both default to an empty JSON value so
    // existing rows (and cohorts with no custom questions) are unaffected.
    await db.execute(sql`
      ALTER TABLE cohorts
        ADD COLUMN IF NOT EXISTS extra_questions JSONB NOT NULL DEFAULT '[]'::jsonb
    `);
    await db.execute(sql`
      ALTER TABLE applications
        ADD COLUMN IF NOT EXISTS extra_answers JSONB NOT NULL DEFAULT '{}'::jsonb
    `);
    // YouTube-backed learning resources sit alongside existing downloadable
    // materials. The columns are nullable so all existing resources remain
    // unchanged.
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'video'
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'resource_type')
        ) THEN
          ALTER TYPE resource_type ADD VALUE 'video';
        END IF;
      END
      $$;
    `);
    await db.execute(sql`
      ALTER TABLE resources
        ADD COLUMN IF NOT EXISTS youtube_video_id TEXT,
        ADD COLUMN IF NOT EXISTS youtube_url TEXT,
        ADD COLUMN IF NOT EXISTS youtube_thumbnail_url TEXT,
        ADD COLUMN IF NOT EXISTS youtube_duration_seconds INTEGER,
        ADD COLUMN IF NOT EXISTS youtube_privacy_status TEXT,
        ADD COLUMN IF NOT EXISTS youtube_upload_status TEXT,
        ADD COLUMN IF NOT EXISTS video_source video_source,
        ADD COLUMN IF NOT EXISTS video_storage_key TEXT,
        ADD COLUMN IF NOT EXISTS video_content_type TEXT,
        ADD COLUMN IF NOT EXISTS video_file_size INTEGER
    `);
    log("Schema migrations applied successfully");

    // Data migration: backfill slugs/status for pre-existing cohorts, seed the two
    // real recurring cohorts (AFARA CORE + DOREWA), and keep applications assigned.
    await db.execute(sql`
      DO $$
      DECLARE
        v_cohort_id TEXT;
      BEGIN
        -- Backfill display name + slug for any pre-existing cohort rows
        UPDATE cohorts SET display_name = name WHERE display_name IS NULL;
        UPDATE cohorts
          SET slug = lower(regexp_replace(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g')) || '-' || substr(id, 1, 8)
          WHERE slug IS NULL OR slug = '';

        -- One-time reconciliation: a cohort already open before this migration ran
        -- should carry status 'open' rather than the fresh column default.
        UPDATE cohorts SET status = 'open' WHERE status = 'draft' AND is_open = true;

        -- Create AFARA CORE COHORT if it doesn't exist yet
        IF NOT EXISTS (SELECT 1 FROM cohorts WHERE slug = 'core') THEN
          INSERT INTO cohorts (
            id, name, display_name, slug, version, series_key, cohort_type, status,
            year, description, tagline,
            is_active, is_open, created_at
          ) VALUES (
            gen_random_uuid()::text, 'AFARA CORE COHORT', 'AFARA Core Cohort', 'core', '1.0', 'afara-core', 'core', 'draft',
            2026, 'The flagship recurring cohort of the AFARA Africa Accelerator.', 'The Flagship AFARA Africa Accelerator Cohort',
            true, false, NOW()
          );
        END IF;

        -- Create DOREWA COHORT if it doesn't exist yet
        IF NOT EXISTS (SELECT 1 FROM cohorts WHERE slug = 'dorewa') THEN
          INSERT INTO cohorts (
            id, name, display_name, slug, version, series_key, cohort_type, status,
            year, sponsor, geography, sector, description, tagline, partnership_note,
            is_active, is_open, created_at
          ) VALUES (
            gen_random_uuid()::text, 'DOREWA COHORT', 'DOREWA', 'dorewa', '1.0', 'dorewa', 'sponsored', 'draft',
            2026, 'Kingdom of the Netherlands', 'Nigeria', 'Agriculture + Renewable Energy',
            'DOREWA is a sponsored cohort of the AFARA Africa Accelerator, delivered in collaboration with the Kingdom of the Netherlands.',
            'The Women-Led Agri-Energy Cohort', 'An AFARA Africa Accelerator Cohort, in collaboration with the Kingdom of the Netherlands',
            true, false, NOW()
          );
        END IF;

        -- Assign all unassigned applications to the first (oldest) cohort, preserving prior behavior
        SELECT id INTO v_cohort_id FROM cohorts ORDER BY created_at ASC LIMIT 1;
        UPDATE applications SET cohort_id = v_cohort_id WHERE cohort_id IS NULL;
      END
      $$;
    `);
    // Enforce slug uniqueness now that every row has one
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'cohorts_slug_unique'
        ) THEN
          ALTER TABLE cohorts ADD CONSTRAINT cohorts_slug_unique UNIQUE (slug);
        END IF;
      END
      $$;
    `);
    log("Data migrations applied successfully");
  } catch (err) {
    console.error("Schema migration failed:", err);
  }
}
