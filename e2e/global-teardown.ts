import { existsSync, readFileSync, rmSync } from "node:fs";
import {
  ACCOUNT_SWITCH_CREDENTIALS_FILE,
  cleanupLmsAccountSwitchData,
  type AccountSwitchCredentials,
} from "../scripts/seed-lms-account-switch";
import { pool } from "../server/db";

export default async function globalTeardown() {
  if (process.env.E2E_SEED_DATABASE !== "true") return;

  try {
    if (existsSync(ACCOUNT_SWITCH_CREDENTIALS_FILE)) {
      const credentials = JSON.parse(
        readFileSync(ACCOUNT_SWITCH_CREDENTIALS_FILE, "utf8"),
      ) as AccountSwitchCredentials;
      await cleanupLmsAccountSwitchData(credentials);
      rmSync(ACCOUNT_SWITCH_CREDENTIALS_FILE);
    }
  } finally {
    await pool.end();
  }
}