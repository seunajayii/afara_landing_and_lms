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

async function formatBrowserTime(page: Page, timeValue: string) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  return page.evaluate(
    ({ hours, minutes }) =>
      new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    { hours, minutes },
  );
}

async function selectDateTime(
  page: Page,
  dateTestId: string,
  timeTestId: string,
  dateValue: string,
  timeValue: string,
) {
  await page.getByTestId(dateTestId).first().click();
  const datePopover = page.getByRole("dialog").last();

  const [year, month, day] = dateValue.split("-").map(Number);
  const browserToday = await page.evaluate(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() + 1 };
  });
  const monthDelta =
    (year - browserToday.year) * 12 + (month - browserToday.month);
  const monthButton = datePopover.getByRole("button", {
    name: monthDelta >= 0 ? "Go to next month" : "Go to previous month",
  });
  for (let index = 0; index < Math.abs(monthDelta); index += 1) {
    await monthButton.click();
  }

  const calendar = datePopover.getByRole("grid");
  await calendar
    .locator('button[name="day"]:not(.day-outside)')
    .filter({ hasText: new RegExp(`^${day}$`) })
    .click();

  const timeTrigger = page.getByTestId(timeTestId);
  await timeTrigger.scrollIntoViewIfNeeded();
  await timeTrigger.click();
  const timeLabel = await formatBrowserTime(page, timeValue);
  const timeOption = page.getByRole("option", { name: timeLabel, exact: true });
  await timeOption.click();
  await page.getByRole("button", { name: "Done", exact: true }).last().click();
  await expect(page.getByTestId(dateTestId)).toHaveCount(1);
}

test.describe("admin event date and time fields", () => {
  test("keeps selected create and edit values local, including clearing the optional end", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 500 });
    const credentials = loadCredentials();
    test.skip(
      !credentials,
      "Run npm run test:e2e for the seeded check, or provide the super-admin E2E variables.",
    );

    const title = `E2E event date stability ${Date.now()}`;
    const startDate = "2030-05-06";
    const startTime = "14:30";
    const endDate = "2030-05-06";
    const endTime = "16:00";
    let eventId: string | undefined;

    try {
      await signIn(page, credentials!.superAdmin.email, credentials!.superAdmin.password);
      await page.goto("/admin/events");
      await expect(page.getByRole("heading", { name: "Event Management", exact: true })).toBeVisible();

      await page.getByTestId("button-create-event").click();
      await expect(page.getByRole("dialog", { name: "Create New Event" })).toBeVisible();

      await page.getByTestId("input-create-title").fill(title);
      await selectDateTime(page, "input-create-start-date", "input-create-start-time", startDate, startTime);
      await selectDateTime(page, "input-create-end-date", "input-create-end-time", endDate, endTime);
      await page
        .getByTestId("input-create-meeting-link")
        .fill("https://example.com/e2e-event-date-stability");

      const startTimeLabel = await formatBrowserTime(page, startTime);
      const endTimeLabel = await formatBrowserTime(page, endTime);
      await expect(page.getByTestId("input-create-start-date").first()).toContainText(
        `Mon, May 6, 2030 · ${startTimeLabel}`,
      );
      await expect(page.getByTestId("input-create-end-date").first()).toContainText(
        `Mon, May 6, 2030 · ${endTimeLabel}`,
      );

      const createResponsePromise = page.waitForResponse(eventApiResponse);
      await page.getByTestId("button-submit-create").click();
      const createResponse = await createResponsePromise;
      expect(createResponse.status()).toBe(201);
      const createPayload = createResponse.request().postDataJSON() as {
        startTime: string;
        endTime: string;
      };
      // datetime-local controls submit local wall-clock values without a
      // timezone offset; the server turns those values into stored instants.
      expect(createPayload.startTime).toBe(`${startDate}T${startTime}`);
      expect(createPayload.endTime).toBe(`${endDate}T${endTime}`);

      const createdEvent = (await createResponse.json()) as { id: string };
      eventId = createdEvent.id;

      const eventCard = page.locator(`[data-testid="card-event-${eventId}"]`);
      await expect(eventCard).toBeVisible();
      await eventCard.getByTestId(`button-edit-event-${eventId}`).click();
      await expect(page.getByRole("dialog", { name: "Edit Event" })).toBeVisible();

      await expect(page.getByTestId("input-edit-start-date").first()).toContainText(
        `Mon, May 6, 2030 · ${startTimeLabel}`,
      );
      await expect(page.getByTestId("input-edit-end-date").first()).toContainText(
        `Mon, May 6, 2030 · ${endTimeLabel}`,
      );

      await page.getByTestId("input-edit-end-date").first().click();
      await page.getByRole("button", { name: "Clear", exact: true }).click();
      await expect(page.getByTestId("input-edit-end-date").first()).toContainText(
        "Choose end date and time",
      );
      await page.getByRole("button", { name: "Done", exact: true }).last().click();
      await expect(page.getByTestId("input-edit-end-date")).toHaveCount(1);

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

  test.describe("when the browser is in a non-UTC timezone", () => {
    test.use({ timezoneId: "America/Los_Angeles" });

    test("shows a stored event instant as the expected local edit value", async ({ page }) => {
      const credentials = loadCredentials();
      test.skip(
        !credentials,
        "Run npm run test:e2e for the seeded check, or provide the super-admin E2E variables.",
      );

      const title = `E2E event timezone stability ${Date.now()}`;
      const storedStartTime = "2030-05-06T21:35:00.000Z";
      const storedEndTime = "2030-05-06T23:05:00.000Z";
      let eventId: string | undefined;

      try {
        await signIn(page, credentials!.superAdmin.email, credentials!.superAdmin.password);

        // Use a fixed UTC instant so this check verifies the edit form's
        // conversion rather than relying on the server and browser sharing a
        // timezone. In Los Angeles on this date, these are 14:35 and 16:05.
        const createResponse = await page.request.post("/api/events", {
          data: {
            title,
            eventType: "webinar",
            startTime: storedStartTime,
            endTime: storedEndTime,
            durationMinutes: 90,
            meetingPlatform: "Zoom",
            meetingLink: "https://example.com/e2e-event-timezone-stability",
            maxAttendees: 100,
            isPublic: true,
            visibility: "community",
            status: "published",
          },
        });
        expect(createResponse.status()).toBe(201);

        const createdEvent = (await createResponse.json()) as {
          id: string;
          startTime: string;
          endTime: string;
        };
        expect(createdEvent.startTime).toBe(storedStartTime);
        expect(createdEvent.endTime).toBe(storedEndTime);
        eventId = createdEvent.id;

        await page.goto("/admin/events");
        await expect(page.getByRole("heading", { name: "Event Management", exact: true })).toBeVisible();

        const eventCard = page.locator(`[data-testid="card-event-${eventId}"]`);
        await expect(eventCard).toBeVisible();
        await eventCard.getByTestId(`button-edit-event-${eventId}`).click();
        await expect(page.getByRole("dialog", { name: "Edit Event" })).toBeVisible();

        await expect(page.getByTestId("input-edit-start-date").first()).toContainText(
          "Mon, May 6, 2030",
        );
        await expect(page.getByTestId("input-edit-start-date").first()).toContainText(
          /(?:14:35|2:35 PM)/,
        );
        await expect(page.getByTestId("input-edit-end-date").first()).toContainText(
          "Mon, May 6, 2030",
        );
        await expect(page.getByTestId("input-edit-end-date").first()).toContainText(
          /(?:16:05|4:05 PM)/,
        );
      } finally {
        if (eventId) {
          const deleteResponse = await page.request.delete(`/api/events/${eventId}`);
          expect(deleteResponse.ok()).toBeTruthy();
        }
      }
    });
  });
});