import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Account = { email: string; password: string };
type AdminCohortCredentials = {
  superAdmin: Account;
  fixture?: {
    adminOnlyCohortId: string;
  };
};

function loadCredentials(): AdminCohortCredentials | null {
  const credentialsFile =
    process.env.E2E_CREDENTIALS_FILE ||
    resolve(process.cwd(), ".playwright/e2e-credentials.json");
  try {
    return JSON.parse(readFileSync(credentialsFile, "utf8")) as AdminCohortCredentials;
  } catch {
    if (process.env.E2E_SUPERADMIN_EMAIL && process.env.E2E_SUPERADMIN_PASSWORD) {
      return {
        superAdmin: {
          email: process.env.E2E_SUPERADMIN_EMAIL,
          password: process.env.E2E_SUPERADMIN_PASSWORD,
        },
      };
    }
    return null;
  }
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByTestId("input-login-email").fill(email);
  await page.getByTestId("input-login-password").fill(password);
  await page.getByTestId("button-login").click();
  await expect(page).not.toHaveURL(/\/login$/);
}

test.describe("admin cohort workspace", () => {
  test("opens the selected cohort workspace and preserves it after reload", async ({ page }) => {
    const credentials = loadCredentials();
    test.skip(
      !credentials?.fixture?.adminOnlyCohortId,
      "Run npm run test:e2e for the seeded admin cohort workspace fixture, or provide the super-admin E2E variables.",
    );

    const cohortId = credentials!.fixture!.adminOnlyCohortId;
    const cohortNamespace = cohortId.slice(0, -"-admin-only-cohort".length);
    const cohortName = `E2E Admin-only Cohort (${cohortNamespace})`;

    await signIn(page, credentials!.superAdmin.email, credentials!.superAdmin.password);
    await page.goto("/admin/dashboard");

    await page.getByTestId("select-admin-cohort-context").click();
    await page.getByRole("option", { name: new RegExp(cohortName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).click();

    await expect(page).toHaveURL(
      new RegExp(`/admin/dashboard\\?cohortId=${cohortId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
    );
    await expect(page.locator("main").getByRole("heading", { name: cohortName, exact: true })).toBeVisible();
    await expect(page.getByText("0 applications", { exact: true })).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL(
      new RegExp(`/admin/dashboard\\?cohortId=${cohortId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
    );
    await expect(page.locator("main").getByRole("heading", { name: cohortName, exact: true })).toBeVisible();
    await expect(page.getByText("0 applications", { exact: true })).toBeVisible();
  });
});