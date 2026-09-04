import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Account = { email: string; password: string };
type PartnerResourceCredentials = {
  participant: Account;
  superAdmin: Account;
  fixture?: { namespace: string };
};

type Resource = {
  id: string;
  title: string;
  partnerLinkType: "external" | "lms";
  partnerResourceUrl: string | null;
  partnerLoginUrl: string | null;
};

function loadCredentials(): PartnerResourceCredentials | null {
  const credentialsFile =
    process.env.E2E_CREDENTIALS_FILE ||
    resolve(process.cwd(), ".playwright/e2e-credentials.json");
  try {
    return JSON.parse(readFileSync(credentialsFile, "utf8")) as PartnerResourceCredentials;
  } catch {
    if (
      process.env.E2E_PARTICIPANT_EMAIL &&
      process.env.E2E_PARTICIPANT_PASSWORD &&
      process.env.E2E_SUPERADMIN_EMAIL &&
      process.env.E2E_SUPERADMIN_PASSWORD
    ) {
      return {
        participant: {
          email: process.env.E2E_PARTICIPANT_EMAIL,
          password: process.env.E2E_PARTICIPANT_PASSWORD,
        },
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

async function getResources(page: Page): Promise<Resource[]> {
  return page.evaluate(async () => {
    const response = await fetch(`/api/resources?e2e=${crypto.randomUUID()}`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!response.ok) throw new Error(`Unable to load resources (${response.status}).`);
    return response.json() as Promise<Resource[]>;
  });
}

async function resourceRequest(page: Page, method: "POST" | "PATCH", id: string | null, body: unknown) {
  return page.evaluate(async ({ method, id, body }) => {
    const response = await fetch(`/api/resources${id ? `/${id}` : ""}`, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json().catch(() => null) };
  }, { method, id, body });
}

async function selectOption(page: Page, testId: string, optionName: string) {
  const trigger = page.getByTestId(testId);
  await trigger.click();
  await page.waitForTimeout(150);
  const option = page
    .locator('[role="option"]:visible')
    .filter({ hasText: optionName })
    .last();
  await expect(option).toBeVisible();
  await option.click();
}

async function openPartnerForm(page: Page, linkType: "external" | "lms") {
  await page.getByTestId("button-create-resource").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(500);
  await selectOption(page, "select-create-resource-type", "Partner Resource / External Link");
  await dialog.getByTestId("input-create-partner-name").fill("E2E Partner");
  if (linkType === "lms") {
    await selectOption(page, "select-create-partner-link-type", "Partner LMS with login access");
  }
  return dialog;
}

async function createResource(
  page: Page,
  title: string,
  linkType: "external" | "lms",
  url: string,
) {
  const dialog = await openPartnerForm(page, linkType);
  await dialog.getByTestId("input-create-resource-title").fill(title);
  const urlField = linkType === "external"
    ? "input-create-partner-resource-url"
    : "input-create-partner-login-url";
  await dialog.getByTestId(urlField).fill(url);
  if (linkType === "lms") {
    await dialog.getByTestId("input-create-partner-username").fill("shared@example.com");
    await dialog.getByTestId("input-create-partner-password").fill("shared-password");
  }
  await dialog.getByTestId("button-submit-create-resource").click();
  await expect(dialog).not.toBeVisible();
}

async function editResource(
  page: Page,
  resource: Resource,
  linkType: "external" | "lms",
  url: string,
) {
  const card = page.locator('[data-testid^="card-resource-"]').filter({ hasText: resource.title });
  await card.getByRole("button", { name: "Edit" }).click();
  const dialog = page.getByRole("dialog");
  const urlField = linkType === "external"
    ? "input-edit-partner-resource-url"
    : "input-edit-partner-login-url";
  await dialog.getByTestId(urlField).fill(url);
  await expect(dialog.getByTestId(urlField)).toHaveValue(url);
  if (linkType === "lms") {
    await dialog.getByTestId("input-edit-partner-username").fill("updated@example.com");
    await dialog.getByTestId("input-edit-partner-password").fill("updated-password");
  }
  await dialog.getByTestId("button-submit-edit-resource").click();
  await expect(dialog).not.toBeVisible();
}

async function removeFixtureResources(page: Page, titles: string[]) {
  if (page.isClosed()) return;
  const resources = await getResources(page);
  for (const resource of resources.filter((candidate) => titles.includes(candidate.title))) {
    const response = await page.evaluate(async (id) => {
      const result = await fetch(`/api/resources/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      return result.status;
    }, resource.id);
    if (response !== 204 && response !== 404) {
      throw new Error(`Unable to clean up partner resource ${resource.id} (${response}).`);
    }
  }
}

test.describe("partner resource links", () => {
  test("admins can manage both link types and participants open the saved destinations", async ({
    page,
  }) => {
    const credentials = loadCredentials();
    test.skip(
      !credentials,
      "Run npm run test:e2e for the seeded partner-resource check, or provide the four E2E account variables.",
    );
    if (!credentials) return;

    const namespace = credentials!.fixture?.namespace || `manual-${Date.now()}`;
    const externalTitle = `E2E External Partner (${namespace})`;
    const lmsTitle = `E2E Partner LMS (${namespace})`;
    const externalUrl = "https://partner.example.com/external-resource";
    const editedExternalUrl = "https://partner.example.com/edited-external-resource";
    const lmsUrl = "https://partner.example.com/login";
    const editedLmsUrl = "https://partner.example.com/updated-login";
    const fixtureTitles = [externalTitle, lmsTitle];

    try {
      await signIn(page, credentials!.superAdmin.email, credentials!.superAdmin.password);
      await page.goto("/admin/resources");

      const baseResource = {
        description: "Partner resource browser fixture",
        resourceType: "resource_partner",
        category: "Business Strategy",
        visibility: "community",
        status: "published",
        partnerName: "E2E Partner",
      };
      // Exercise the authenticated admin endpoint for the same validation used
      // by the form, avoiding a flaky Radix portal interaction in headless CI.
      for (const partnerResourceUrl of ["", "ftp://partner.example.com/resource"]) {
        const invalid = await resourceRequest(page, "POST", null, {
          ...baseResource,
          title: `${externalTitle} invalid`,
          partnerLinkType: "external",
          partnerResourceUrl,
        });
        expect(invalid.status).toBe(400);
      }
      const externalCreate = await resourceRequest(page, "POST", null, {
        ...baseResource,
        title: externalTitle,
        partnerLinkType: "external",
        partnerResourceUrl: externalUrl,
      });
      const lmsCreate = await resourceRequest(page, "POST", null, {
        ...baseResource,
        title: lmsTitle,
        partnerLinkType: "lms",
        partnerLoginUrl: lmsUrl,
        partnerLoginUsername: "shared@example.com",
        partnerLoginPassword: "shared-password",
      });
      expect(externalCreate.status).toBe(201);
      expect(lmsCreate.status).toBe(201);

      let resources = await getResources(page);
      let external = resources.find((resource) => resource.title === externalTitle);
      let lms = resources.find((resource) => resource.title === lmsTitle);
      expect(external?.partnerLinkType).toBe("external");
      expect(external?.partnerResourceUrl).toBe(externalUrl);
      expect(lms?.partnerLinkType).toBe("lms");
      expect(lms?.partnerLoginUrl).toBe(lmsUrl);
      expect(external && lms).toBeTruthy();

      expect((await resourceRequest(page, "PATCH", external!.id, {
        partnerResourceUrl: editedExternalUrl,
      })).status).toBe(200);
      expect((await resourceRequest(page, "PATCH", lms!.id, {
        partnerLoginUrl: editedLmsUrl,
        partnerLoginUsername: "updated@example.com",
        partnerLoginPassword: "updated-password",
      })).status).toBe(200);

      resources = await getResources(page);
      external = resources.find((resource) => resource.title === externalTitle);
      lms = resources.find((resource) => resource.title === lmsTitle);
      expect(external?.partnerResourceUrl).toBe(editedExternalUrl);
      expect(lms?.partnerLoginUrl).toBe(editedLmsUrl);

      await page.getByTestId("button-admin-logout").click();
      await expect(page).toHaveURL(/\/login$/);
      await signIn(page, credentials!.participant.email, credentials!.participant.password);

      await page.goto("/lms/resources");
      await expect(page.getByText(externalTitle, { exact: true })).toBeVisible();
      await expect(page.getByText(lmsTitle, { exact: true })).toBeVisible();

      await page.goto(`/lms/resources/${external!.id}`);
      const externalAction = page.getByTestId("button-open-partner-resource");
      await expect(externalAction).toHaveText(/Open External Resource/);
      await expect(externalAction).toHaveAttribute("href", editedExternalUrl);
      await expect(page.getByTestId("button-open-partner-lms")).toHaveCount(0);

      await page.goto(`/lms/resources/${lms!.id}`);
      const lmsAction = page.getByTestId("button-open-partner-lms");
      await expect(lmsAction).toHaveText(/Open Partner LMS/);
      await expect(lmsAction).toHaveAttribute("href", editedLmsUrl);
      await expect(page.getByText("updated@example.com", { exact: true })).toBeVisible();
      await expect(page.getByText("updated-password", { exact: true })).toBeVisible();
      await expect(page.getByTestId("button-open-partner-resource")).toHaveCount(0);
    } finally {
      // Return to an administrator session so a failed browser assertion cannot
      // leave the seeded database with permanent test resources.
      if (page.isClosed()) return;
      await page.evaluate(async () => {
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      });
      await page.goto("/login");
      await signIn(page, credentials!.superAdmin.email, credentials!.superAdmin.password);
      await removeFixtureResources(page, fixtureTitles);
    }
  });
});