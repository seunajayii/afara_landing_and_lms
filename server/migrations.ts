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
    log("Schema migrations applied successfully");

    // Data migration: ensure Cohort 1 exists and all unassigned applications belong to it
    await db.execute(sql`
      DO $$
      DECLARE
        v_cohort_id TEXT;
      BEGIN
        -- Create Cohort 1 if no cohorts exist yet
        IF NOT EXISTS (SELECT 1 FROM cohorts LIMIT 1) THEN
          INSERT INTO cohorts (id, name, year, is_active, is_open, created_at)
          VALUES (gen_random_uuid()::text, 'Cohort 1', 2026, true, false, NOW());
        END IF;

        -- Assign all unassigned applications to the first (oldest) cohort
        SELECT id INTO v_cohort_id FROM cohorts ORDER BY created_at ASC LIMIT 1;
        UPDATE applications SET cohort_id = v_cohort_id WHERE cohort_id IS NULL;
      END
      $$;
    `);
    log("Data migrations applied successfully");
  } catch (err) {
    console.error("Schema migration failed:", err);
  }
}
