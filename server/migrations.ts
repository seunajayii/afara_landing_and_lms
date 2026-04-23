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
    log("Schema migrations applied successfully");
  } catch (err) {
    console.error("Schema migration failed:", err);
  }
}
