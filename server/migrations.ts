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
        ADD COLUMN IF NOT EXISTS file_storage_key TEXT,
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
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS resource_file_uploads (
        id VARCHAR PRIMARY KEY,
        contents BYTEA NOT NULL,
        content_type TEXT NOT NULL,
        file_name TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      ALTER TABLE resources
        ADD COLUMN IF NOT EXISTS partner_link_type TEXT NOT NULL DEFAULT 'lms',
        ADD COLUMN IF NOT EXISTS partner_resource_url TEXT
    `);
    // Private video objects are created before the resource form is saved.
    // Keep a durable owner/timestamp ledger so abandoned objects can be
    // removed after a retention period without touching attached resources.
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS private_video_uploads (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        storage_key TEXT NOT NULL UNIQUE,
        uploaded_by_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        resource_id VARCHAR REFERENCES resources(id) ON DELETE SET NULL,
        cleanup_requested_at TIMESTAMP,
        cleanup_status TEXT NOT NULL DEFAULT 'active',
        cleanup_attempt_count INTEGER NOT NULL DEFAULT 0,
        last_cleanup_attempt_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      ALTER TABLE private_video_uploads
        ADD COLUMN IF NOT EXISTS cleanup_requested_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS cleanup_status TEXT NOT NULL DEFAULT 'active',
        ADD COLUMN IF NOT EXISTS cleanup_attempt_count INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_cleanup_attempt_at TIMESTAMP
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS private_video_uploads_created_at_idx
        ON private_video_uploads (created_at)
    `);
    // Zoom may retry webhook notifications. Keep a durable receipt ledger so
    // the recording importer can be safely retried without duplicate work.
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS zoom_webhook_events (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id TEXT NOT NULL UNIQUE,
        event_type TEXT NOT NULL,
        payload JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'received',
        received_at TIMESTAMP NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMP,
        error TEXT
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS zoom_webhook_events_received_at_idx
        ON zoom_webhook_events (received_at)
    `);
    await db.execute(sql`
      ALTER TABLE zoom_webhook_events
        ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP
    `);
    // Store one encrypted Zoom OAuth connection for meeting management. The
    // application encrypts the token values before they reach this table.
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS zoom_oauth_connections (
        id VARCHAR PRIMARY KEY,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        access_token_expires_at TIMESTAMP NOT NULL,
        scope TEXT,
        zoom_user_id TEXT,
        zoom_user_email TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    // Zoom recording delivery is configured per event. Keep the provider
    // meeting ID and the optional curriculum lesson mapping separate from the
    // existing manual recording URL for backwards compatibility.
    await db.execute(sql`
      ALTER TABLE events
        ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT,
        ADD COLUMN IF NOT EXISTS recording_resource_id VARCHAR REFERENCES resources(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS recording_lesson_id VARCHAR REFERENCES lessons(id) ON DELETE SET NULL
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS events_zoom_meeting_id_idx
        ON events (zoom_meeting_id)
    `);
    // Course curriculum additions are nullable/defaulted so existing courses
    // and seeded lessons keep working. Existing lessons are treated as
    // published to preserve the learner experience they already had.
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'courses' AND column_name = 'duration_override_minutes'
        ) THEN
          ALTER TABLE courses ADD COLUMN duration_override_minutes INTEGER;
          -- Existing manually entered durations become explicit overrides exactly
          -- once. Subsequent blank overrides must remain blank.
          UPDATE courses
            SET duration_override_minutes = duration_minutes
            WHERE duration_minutes IS NOT NULL;
        END IF;
      END
      $$;
    `);
    await db.execute(sql`
      ALTER TABLE lessons
        ADD COLUMN IF NOT EXISTS resource_id VARCHAR REFERENCES resources(id),
        ADD COLUMN IF NOT EXISTS status content_status NOT NULL DEFAULT 'published'
    `);
    await db.execute(sql`
      ALTER TABLE lessons ALTER COLUMN status SET DEFAULT 'draft';
    `);
    // Course visibility defaults to all participants so existing published
    // courses remain available until an admin explicitly selects cohorts.
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_audience') THEN
          CREATE TYPE course_audience AS ENUM ('all', 'selected');
        END IF;
      END
      $$;
    `);
    await db.execute(sql`
      ALTER TABLE courses
        ADD COLUMN IF NOT EXISTS audience course_audience NOT NULL DEFAULT 'all'
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS course_cohort_assignments (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        cohort_id VARCHAR NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
        UNIQUE (course_id, cohort_id)
      )
    `);
    await db.execute(sql`
      ALTER TABLE newsletter_campaigns
        ADD COLUMN IF NOT EXISTS content_json JSONB,
        ADD COLUMN IF NOT EXISTS audience_json JSONB,
        ADD COLUMN IF NOT EXISTS last_test_sent_at TIMESTAMP
    `);
    // Programme certificates are cohort-scoped requests. Existing course
    // certificates remain valid, so course_id becomes optional.
    await db.execute(sql`
      ALTER TABLE certificates
        ADD COLUMN IF NOT EXISTS cohort_id VARCHAR REFERENCES cohorts(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP NOT NULL DEFAULT NOW()
    `);
    await db.execute(sql`
      ALTER TABLE certificates ALTER COLUMN course_id DROP NOT NULL
    `);
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS certificates_user_cohort_idx
        ON certificates (user_id, cohort_id)
        WHERE cohort_id IS NOT NULL
    `);
    // Learning pods group accepted cohort participants around one assigned
    // mentor. Work and submissions are kept separate from one-to-one
    // mentorship sessions so both experiences can coexist.
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'learning_pod_status') THEN
          CREATE TYPE learning_pod_status AS ENUM ('active', 'archived');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pod_work_type') THEN
          CREATE TYPE pod_work_type AS ENUM ('individual', 'group');
        END IF;
      END
      $$;
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS learning_pods (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        cohort_id VARCHAR NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        mentor_id VARCHAR NOT NULL REFERENCES users(id),
        status learning_pod_status NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (cohort_id, name)
      );
      CREATE INDEX IF NOT EXISTS learning_pods_cohort_idx ON learning_pods (cohort_id);
      CREATE INDEX IF NOT EXISTS learning_pods_mentor_idx ON learning_pods (mentor_id);
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS learning_pod_members (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        pod_id VARCHAR NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
        removed_at TIMESTAMP,
        UNIQUE (pod_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS learning_pod_members_user_idx ON learning_pod_members (user_id);
      CREATE INDEX IF NOT EXISTS learning_pod_members_pod_idx ON learning_pod_members (pod_id);
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS learning_pod_assignments (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        pod_id VARCHAR NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        instructions TEXT,
        work_type pod_work_type NOT NULL DEFAULT 'individual',
        status content_status NOT NULL DEFAULT 'published',
        due_at TIMESTAMP,
        max_score INTEGER NOT NULL DEFAULT 100,
        created_by_id VARCHAR NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS learning_pod_assignments_pod_idx ON learning_pod_assignments (pod_id);
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS learning_pod_submissions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        assignment_id VARCHAR NOT NULL REFERENCES learning_pod_assignments(id) ON DELETE CASCADE,
        pod_id VARCHAR NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
        submitter_id VARCHAR NOT NULL REFERENCES users(id),
        submission_text TEXT,
        submission_url TEXT,
        submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        score INTEGER,
        feedback TEXT,
        evaluated_by_id VARCHAR REFERENCES users(id),
        evaluated_at TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS learning_pod_submissions_assignment_idx ON learning_pod_submissions (assignment_id);
      CREATE INDEX IF NOT EXISTS learning_pod_submissions_pod_idx ON learning_pod_submissions (pod_id);
    `);
    // Shared assignments support quizzes, take-home work, and reflections
    // across cohort, pod, course, and module contexts. Existing pod
    // assignments remain untouched for backwards compatibility.
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_type') THEN
          CREATE TYPE assignment_type AS ENUM ('quiz', 'submission', 'reflection');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_target_type') THEN
          CREATE TYPE assignment_target_type AS ENUM ('cohort', 'pod', 'course', 'module');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_question_type') THEN
          CREATE TYPE assignment_question_type AS ENUM ('single_choice', 'multiple_choice', 'short_text', 'long_text', 'reflection');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_submission_status') THEN
          CREATE TYPE assignment_submission_status AS ENUM ('draft', 'submitted', 'graded', 'returned');
        END IF;
      END
      $$;
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS assignments (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        cohort_id VARCHAR NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        instructions TEXT,
        assignment_type assignment_type NOT NULL,
        status content_status NOT NULL DEFAULT 'draft',
        due_at TIMESTAMP,
        max_score INTEGER NOT NULL DEFAULT 100,
        passing_score INTEGER NOT NULL DEFAULT 70,
        created_by_id VARCHAR NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS assignments_cohort_idx ON assignments (cohort_id);
      CREATE INDEX IF NOT EXISTS assignments_status_idx ON assignments (status);
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS assignment_targets (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        assignment_id VARCHAR NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        target_type assignment_target_type NOT NULL,
        target_id VARCHAR NOT NULL,
        UNIQUE (assignment_id, target_type, target_id)
      );
      CREATE INDEX IF NOT EXISTS assignment_targets_lookup_idx ON assignment_targets (target_type, target_id);
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS assignment_questions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        assignment_id VARCHAR NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        prompt TEXT NOT NULL,
        question_type assignment_question_type NOT NULL,
        options JSONB NOT NULL DEFAULT '[]'::jsonb,
        correct_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
        points INTEGER NOT NULL DEFAULT 1,
        order_index INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS assignment_questions_assignment_idx ON assignment_questions (assignment_id, order_index);
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS assignment_submissions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        assignment_id VARCHAR NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        pod_id VARCHAR REFERENCES learning_pods(id) ON DELETE SET NULL,
        attempt_number INTEGER NOT NULL DEFAULT 1,
        status assignment_submission_status NOT NULL DEFAULT 'draft',
        response_text TEXT,
        links TEXT[] NOT NULL DEFAULT '{}',
        file_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
        completed_at TIMESTAMP,
        submitted_at TIMESTAMP,
        reviewed_at TIMESTAMP,
        score INTEGER,
        passed BOOLEAN,
        feedback TEXT,
        internal_notes TEXT,
        reviewed_by_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS assignment_submissions_assignment_user_idx ON assignment_submissions (assignment_id, user_id, updated_at);
      CREATE INDEX IF NOT EXISTS assignment_submissions_assignment_idx ON assignment_submissions (assignment_id);
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS assignment_answers (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        submission_id VARCHAR NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
        question_id VARCHAR NOT NULL REFERENCES assignment_questions(id) ON DELETE CASCADE,
        answer JSONB,
        is_correct BOOLEAN,
        score INTEGER,
        feedback TEXT,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (submission_id, question_id)
      );
      CREATE INDEX IF NOT EXISTS assignment_answers_submission_idx ON assignment_answers (submission_id);
    `);
    await db.execute(sql`
      ALTER TABLE learning_pod_assignments
        ADD COLUMN IF NOT EXISTS shared_assignment_id VARCHAR,
        ADD COLUMN IF NOT EXISTS shared_assignment_id_placeholder VARCHAR;
      ALTER TABLE learning_pod_assignments DROP COLUMN IF EXISTS shared_assignment_id_placeholder;
      ALTER TABLE learning_pod_submissions
        ADD COLUMN IF NOT EXISTS shared_submission_id VARCHAR
    `);
    // Convert historical pod work into the shared model without deleting the
    // legacy rows. The linkage columns allow old URLs and review screens to
    // continue working while new reports see the same work.
    await db.execute(sql`
      DO $$
      DECLARE
        legacy_assignment RECORD;
        legacy_submission RECORD;
        v_shared_assignment_id VARCHAR;
        v_shared_submission_id VARCHAR;
      BEGIN
        FOR legacy_assignment IN
          SELECT lpa.*, lp.cohort_id
          FROM learning_pod_assignments lpa
          JOIN learning_pods lp ON lp.id = lpa.pod_id
          WHERE lpa.shared_assignment_id IS NULL
        LOOP
          INSERT INTO assignments (
            cohort_id, title, instructions, assignment_type, status, due_at,
            max_score, passing_score, created_by_id, created_at, updated_at
          ) VALUES (
            legacy_assignment.cohort_id,
            legacy_assignment.title,
            legacy_assignment.instructions,
            'submission',
            legacy_assignment.status,
            legacy_assignment.due_at,
            legacy_assignment.max_score,
            legacy_assignment.max_score,
            legacy_assignment.created_by_id,
            legacy_assignment.created_at,
            legacy_assignment.updated_at
          )
          RETURNING id INTO v_shared_assignment_id;

          INSERT INTO assignment_targets (assignment_id, target_type, target_id)
          VALUES (v_shared_assignment_id, 'pod', legacy_assignment.pod_id);
          UPDATE learning_pod_assignments
          SET shared_assignment_id = v_shared_assignment_id
          WHERE id = legacy_assignment.id;

          FOR legacy_submission IN
            SELECT * FROM learning_pod_submissions
            WHERE assignment_id = legacy_assignment.id
              AND shared_submission_id IS NULL
          LOOP
            INSERT INTO assignment_submissions (
              assignment_id, user_id, pod_id, attempt_number, status,
              response_text, links, completed_at, submitted_at, reviewed_at,
              score, passed, feedback, reviewed_by_id, created_at, updated_at
            ) VALUES (
              v_shared_assignment_id,
              legacy_submission.submitter_id,
              legacy_submission.pod_id,
              1,
              CASE WHEN legacy_submission.score IS NULL THEN 'submitted'::assignment_submission_status ELSE 'graded'::assignment_submission_status END,
              legacy_submission.submission_text,
              CASE WHEN legacy_submission.submission_url IS NULL THEN '{}'::text[] ELSE ARRAY[legacy_submission.submission_url]::text[] END,
              legacy_submission.submitted_at,
              legacy_submission.submitted_at,
              legacy_submission.evaluated_at,
              legacy_submission.score,
              CASE WHEN legacy_submission.score IS NULL THEN NULL ELSE legacy_submission.score >= legacy_assignment.max_score END,
              legacy_submission.feedback,
              legacy_submission.evaluated_by_id,
              legacy_submission.submitted_at,
              legacy_submission.updated_at
            )
            RETURNING id INTO v_shared_submission_id;
            UPDATE learning_pod_submissions
            SET shared_submission_id = v_shared_submission_id
            WHERE id = legacy_submission.id;
          END LOOP;
        END LOOP;
      END
      $$;
    `);
    // Cohort-scoped participant progress records keep the admissions
    // application as an immutable starting point while collecting project
    // milestones, qualitative reviews, and feedback throughout the programme.
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'participant_progress_status') THEN
          CREATE TYPE participant_progress_status AS ENUM ('active', 'completed', 'withdrawn');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progress_review_type') THEN
          CREATE TYPE progress_review_type AS ENUM ('baseline', 'midpoint', 'final');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progress_review_status') THEN
          CREATE TYPE progress_review_status AS ENUM ('draft', 'published');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progress_milestone_status') THEN
          CREATE TYPE progress_milestone_status AS ENUM ('planned', 'in_progress', 'completed', 'blocked');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progress_feedback_source') THEN
          CREATE TYPE progress_feedback_source AS ENUM ('mentor', 'facilitator', 'participant', 'admin');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progress_feedback_visibility') THEN
          CREATE TYPE progress_feedback_visibility AS ENUM ('participant', 'internal');
        END IF;
      END
      $$;
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cohort_participants (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cohort_id VARCHAR NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
        application_id VARCHAR REFERENCES applications(id) ON DELETE SET NULL,
        project_name TEXT,
        project_description TEXT,
        project_stage TEXT,
        status participant_progress_status NOT NULL DEFAULT 'active',
        accepted_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, cohort_id)
      );
      CREATE INDEX IF NOT EXISTS cohort_participants_cohort_idx ON cohort_participants (cohort_id);
      CREATE INDEX IF NOT EXISTS cohort_participants_user_idx ON cohort_participants (user_id);
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS progress_milestones (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        participant_id VARCHAR NOT NULL REFERENCES cohort_participants(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        target_at TIMESTAMP,
        status progress_milestone_status NOT NULL DEFAULT 'planned',
        evidence TEXT,
        completed_at TIMESTAMP,
        created_by_id VARCHAR NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS progress_milestones_participant_idx ON progress_milestones (participant_id);
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS progress_reviews (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        participant_id VARCHAR NOT NULL REFERENCES cohort_participants(id) ON DELETE CASCADE,
        review_type progress_review_type NOT NULL,
        status progress_review_status NOT NULL DEFAULT 'draft',
        reviewer_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        participant_reflection TEXT,
        summary TEXT,
        achievements TEXT,
        challenges TEXT,
        next_steps TEXT,
        area_updates JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP,
        UNIQUE (participant_id, review_type)
      );
      CREATE INDEX IF NOT EXISTS progress_reviews_participant_idx ON progress_reviews (participant_id);
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS progress_feedback (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        participant_id VARCHAR NOT NULL REFERENCES cohort_participants(id) ON DELETE CASCADE,
        source_type progress_feedback_source NOT NULL,
        author_id VARCHAR NOT NULL REFERENCES users(id),
        context_type TEXT,
        context_id VARCHAR,
        content TEXT NOT NULL,
        visibility progress_feedback_visibility NOT NULL DEFAULT 'participant',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS progress_feedback_participant_idx ON progress_feedback (participant_id);
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
            2026, 'Government of the Netherlands', 'Nigeria', 'Agriculture + Renewable Energy',
            'DOREWA is an AFÁRÁ Africa Accelerator Cohort, in collaboration with the Government of the Netherlands and supported by Fundraising Clinic Africa.',
            'The Women-Led Agri-Energy Cohort', 'An AFÁRÁ Africa Accelerator Cohort in collaboration with the Government of the Netherlands and supported by Fundraising Clinic Africa',
            true, false, NOW()
          );
        END IF;

        -- Refresh the original DOREWA copy once while preserving any later admin edits.
        UPDATE cohorts
        SET
          sponsor = 'Government of the Netherlands',
          description = 'DOREWA is an AFÁRÁ Africa Accelerator Cohort, in collaboration with the Government of the Netherlands and supported by Fundraising Clinic Africa.',
          partnership_note = 'An AFÁRÁ Africa Accelerator Cohort in collaboration with the Government of the Netherlands and supported by Fundraising Clinic Africa'
        WHERE slug = 'dorewa'
          AND (
            sponsor = 'Kingdom of the Netherlands'
            OR description = 'DOREWA is a sponsored cohort of the AFARA Africa Accelerator, delivered in collaboration with the Kingdom of the Netherlands.'
            OR partnership_note = 'An AFARA Africa Accelerator Cohort, in collaboration with the Kingdom of the Netherlands'
          );

        -- Add the DOREWA referral question without replacing other custom questions.
        UPDATE cohorts
        SET extra_questions = COALESCE(extra_questions, '[]'::jsonb) || jsonb_build_array(
          jsonb_build_object(
            'id', 'dorewa-referring-organization',
            'label', 'Which organization referred you to DOREWA?',
            'type', 'short_text',
            'required', false
          )
        )
        WHERE slug = 'dorewa'
          AND NOT (COALESCE(extra_questions, '[]'::jsonb) @> '[{"id":"dorewa-referring-organization"}]'::jsonb);

        -- Legacy applications predate the cohort records and were previously
        -- attached to the first cohort by fallback. They belong to Core unless
        -- they were created after the cohort system existed.
        UPDATE applications AS legacy_application
        SET cohort_id = core.id
        FROM cohorts AS core, cohorts AS dorewa
        WHERE core.slug = 'core'
          AND dorewa.slug = 'dorewa'
          AND legacy_application.created_at < LEAST(core.created_at, dorewa.created_at)
          AND (
            legacy_application.cohort_id IS NULL
            OR legacy_application.cohort_id = dorewa.id
          );

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
