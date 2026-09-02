import { existsSync, rmSync } from "node:fs";
import { ACCOUNT_SWITCH_CREDENTIALS_FILE } from "../scripts/seed-lms-account-switch";

export default async function globalTeardown() {
  if (process.env.E2E_SEED_DATABASE !== "true") return;
  if (existsSync(ACCOUNT_SWITCH_CREDENTIALS_FILE)) {
    rmSync(ACCOUNT_SWITCH_CREDENTIALS_FILE);
  }
}