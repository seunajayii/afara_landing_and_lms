import { randomUUID } from "node:crypto";
import { defineConfig, devices } from "@playwright/test";

// The E2E command supplies this once per validation run so separately loaded
// setup and teardown processes resolve the same credentials manifest.
const configuredRunId = process.env.E2E_RUN_ID?.trim();
if (process.env.E2E_SEED_DATABASE === "true" && !configuredRunId) {
  throw new Error(
    "E2E_RUN_ID must be set for seeded Playwright runs. Use npm run test:e2e.",
  );
}
process.env.E2E_RUN_ID = configuredRunId || randomUUID();

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  reporter: process.env.CI
    ? [["dot"], ["html", { outputFolder: "playwright-report", open: "never" }]]
    : [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  ...(process.env.PLAYWRIGHT_BASE_URL
    ? {}
    : {
        webServer: {
          command: "npm run dev",
          url: "http://127.0.0.1:5000/api/health",
          reuseExistingServer: true,
          timeout: 120_000,
        },
      }),
});