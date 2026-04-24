import { sql } from "drizzle-orm";
import { db } from "./db";
import { log } from "./vite";

export async function runSchemaMigrations() {
  try {
    await db.execute(sql`
      ALTER TABLE applications
        ADD COLUMN IF NOT EXISTS registration_proof_url TEXT,
        ADD COLUMN IF NOT EXISTS financial_statements_url TEXT,
        ADD COLUMN IF NOT EXISTS last_draft_email_sent_at TIMESTAMP
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
  } catch (err) {
    console.error("Schema migration failed:", err);
  }
}
