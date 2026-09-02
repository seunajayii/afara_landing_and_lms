import { seedLmsAccountSwitchData } from "../scripts/seed-lms-account-switch";
import { pool } from "../server/db";

export default async function globalSetup() {
  if (process.env.E2E_SEED_DATABASE !== "true") return;

  try {
    await seedLmsAccountSwitchData();
  } finally {
    await pool.end();
  }
}