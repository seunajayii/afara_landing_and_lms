import {
  ACCOUNT_SWITCH_CREDENTIALS_FILE,
  seedLmsAccountSwitchData,
} from "../scripts/seed-lms-account-switch";

export default async function globalSetup() {
  if (process.env.E2E_SEED_DATABASE !== "true") return;

  // Make the generated run-specific path available to worker processes.
  process.env.E2E_CREDENTIALS_FILE = ACCOUNT_SWITCH_CREDENTIALS_FILE;
  await seedLmsAccountSwitchData();
}