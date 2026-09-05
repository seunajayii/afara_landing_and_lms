import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Account = { email: string; password: string };
type EventManagementCredentials = { superAdmin: Account };

function loadCredentials(): EventManagementCredentials | null {
  const credentialsFile =
    process.env.E2E_CREDENTIALS_FILE ||
    resolve(process.cwd(), ".playwright/e2e-credentials.json");
  try {
    return JSON.parse(readFileSync(credentialsFile, "utf8")) as EventManagementCredentials;
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

function eventApiResponse(response: { url(): string; request(): { method(): string } }) {
  const url = new URL(response.url());
  return url.pathname === "/api/events" && response.request().method() === "POST";
}

test.describe("admin event date and time fields", () => {
  test("keeps selected create and edit values local, including clearing the optional end", async ({
    page,
  }) => {
    const credentials = loadCredentials();
    test.skip(
      !credentials,
      "Run npm run test:e2e for the seeded check, or provide the super-admin E2E variables.",
    );

    const title = `E2E event date stability ${Date.now()}`;
    const startDate = "2030-05-06";
    const startTime = "14:35";
    const endDate = "2030-05-06";
    const endTime = "16:05";
    let eventId: string | undefined;

    try {
      await signIn(page, credentials!.superAdmin.email, credentials!.superAdmin.password);
      await page.goto("/admin/events");
      await expect(page.getByRole("heading", { name: "Event Management", exact: true })).toBeVisible();

      await page.getByTestId("button-create-event").click();
      await expect(page.getByRole("dialog", { name: "Create New Event" })).toBeVisible();

      await page.getByTestId("input-create-title").fill(title);
      await page.getByTestId("input-create-start-date").fill(startDate);
      await page.getByTestId("input-create-start-time").fill(startTime);
      await page.getByTestId("input-create-end-date").fill(endDate);
      await page.getByTestId("input-create-end-time").fill(endTime);
      await page
        .getByTestId("input-create-meeting-link")
        .fill("https://example.com/e2e-event-date-stability");

      await expect(page.getByTestId("input-create-start-date")).toHaveValue(startDate);
      await expect(page.getByTestId("input-create-start-time")).toHaveValue(startTime);
      await expect(page.getByTestId("input-create-end-date")).toHaveValue(endDate);
      await expect(page.getByTestId("input-create-end-time")).toHaveValue(endTime);

      const createResponsePromise = page.waitForResponse(eventApiResponse);
      await page.getByTestId("button-submit-create").click();
      const createResponse = await createResponsePromise;
      expect(createResponse.status()).toBe(201);
      const createPayload = createResponse.request().postDataJSON() as {
        startTime: string;
        endTime: string;
      };
      expect(createPayload.startTime).toBe(`${startDate}T${startTime}`);
      expect(createPayload.endTime).toBe(`${endDate}T${endTime}`);

      const createdEvent = (await createResponse.json()) as { id: string };
      eventId = createdEvent.id;

      const eventCard = page.locator(`[data-testid="card-event-${eventId}"]`);
      await expect(eventCard).toBeVisible();
      await eventCard.getByTestId(`button-edit-event-${eventId}`).click();
      await expect(page.getByRole("dialog", { name: "Edit Event" })).toBeVisible();

      await expect(page.getByTestId("input-edit-start-date")).toHaveValue(startDate);
      await expect(page.getByTestId("input-edit-start-time")).toHaveValue(startTime);
      await expect(page.getByTestId("input-edit-end-date")).toHaveValue(endDate);
      await expect(page.getByTestId("input-edit-end-time")).toHaveValue(endTime);

      await page.getByTestId("input-edit-end-date").fill("");
      await expect(page.getByTestId("input-edit-end-date")).toHaveValue("");
      await expect(page.getByTestId("input-edit-end-time")).toHaveValue("");

      const updateResponsePromise = page.waitForResponse(
        (response) => {
          const url = new URL(response.url());
          return (
            url.pathname === `/api/events/${eventId}` &&
            response.request().method() === "PATCH"
          );
        },
      );
      await page.getByTestId("button-submit-edit").click();
      const updateResponse = await updateResponsePromise;
      expect(updateResponse.status()).toBe(200);
      const updatePayload = updateResponse.request().postDataJSON() as {
        startTime: string;
        endTime: string | null;
      };
      expect(updatePayload.startTime).toBe(`${startDate}T${startTime}`);
      expect(updatePayload.endTime).toBeNull();

      const updatedEvent = (await updateResponse.json()) as {
        startTime: string;
        endTime: string | null;
      };
      expect(new Date(updatedEvent.startTime).toISOString()).toBe(
        `${startDate}T${startTime}:00.000Z`,
      );
      expect(updatedEvent.endTime).toBeNull();
    } finally {
      if (eventId) {
        const deleteResponse = await page.request.delete(`/api/events/${eventId}`);
        expect(deleteResponse.ok()).toBeTruthy();
      }
    }
  });
});