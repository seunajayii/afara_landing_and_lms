import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Account = { email: string; password: string };
type CurriculumLifecycleCredentials = {
  participant: Account;
  superAdmin: Account;
  fixture: {
    participantCourseId: string;
    participantCourseTitle: string;
    participantEventId: string;
    participantEventTitle: string;
    participantLessonId: string;
  };
};

function loadCredentials(): CurriculumLifecycleCredentials | null {
  const credentialsFile =
    process.env.E2E_CREDENTIALS_FILE ||
    resolve(process.cwd(), ".playwright/e2e-credentials.json");
  try {
    return JSON.parse(readFileSync(credentialsFile, "utf8")) as CurriculumLifecycleCredentials;
  } catch {
    return null;
  }
}

async function signIn(page: Page, account: Account) {
  await page.goto("/login");
  await page.getByTestId("input-login-email").fill(account.email);
  await page.getByTestId("input-login-password").fill(account.password);
  await page.getByTestId("button-login").click();
  await expect(page).not.toHaveURL(/\/login$/);
}

async function signOut(page: Page) {
  await page.getByTestId("button-logout").click();
  await expect(page).toHaveURL(/\/login$/);
}

test.describe("LMS curriculum lifecycle", () => {
  test("refreshes participant cards after edits and removes archived or deleted curriculum", async ({
    page,
  }) => {
    const credentials = loadCredentials();
    test.skip(
      !credentials,
      "Run npm run test:e2e to use the seeded LMS curriculum lifecycle fixture.",
    );

    const { participant, superAdmin, fixture } = credentials!;
    const editedCourseTitle = `${fixture.participantCourseTitle} — updated`;
    const editedEventTitle = `${fixture.participantEventTitle} — updated`;

    await signIn(page, participant);
    await page.goto("/lms/dashboard");
    await expect(page.getByRole("heading", {
      name: fixture.participantCourseTitle,
      exact: true,
    })).toBeVisible();
    await expect(page.getByText(fixture.participantEventTitle, { exact: true })).toBeVisible();

    await signOut(page);
    await signIn(page, superAdmin);

    const courseUpdate = await page.request.patch(`/api/courses/${fixture.participantCourseId}`, {
      data: { title: editedCourseTitle },
    });
    expect(courseUpdate.ok()).toBe(true);

    const eventUpdate = await page.request.patch(`/api/events/${fixture.participantEventId}`, {
      data: { title: editedEventTitle },
    });
    expect(eventUpdate.ok()).toBe(true);

    await signOut(page);
    await signIn(page, participant);
    await page.goto("/lms/dashboard");
    await expect(page.getByRole("heading", { name: editedCourseTitle, exact: true })).toBeVisible();
    await expect(page.getByText(editedEventTitle, { exact: true })).toBeVisible();

    await page.goto("/lms/courses");
    await expect(page.getByRole("heading", { name: "My Courses", exact: true })).toBeVisible();
    await expect(page.getByText(editedCourseTitle, { exact: true })).toBeVisible();

    await signOut(page);
    await signIn(page, superAdmin);

    const lessonDelete = await page.request.delete(`/api/lessons/${fixture.participantLessonId}`);
    expect(lessonDelete.ok()).toBe(true);

    const archiveCourse = await page.request.patch(`/api/courses/${fixture.participantCourseId}`, {
      data: { status: "draft" },
    });
    expect(archiveCourse.ok()).toBe(true);

    await signOut(page);
    await signIn(page, participant);
    await page.goto("/lms/dashboard");
    await expect(page.getByRole("heading", { name: editedCourseTitle, exact: true })).not.toBeVisible();
    await expect(page.getByText(editedEventTitle, { exact: true })).not.toBeVisible();

    await page.goto("/lms/courses");
    await expect(page.getByText(editedCourseTitle, { exact: true })).not.toBeVisible();

    await signOut(page);
    await signIn(page, superAdmin);
    const courseDelete = await page.request.delete(`/api/courses/${fixture.participantCourseId}`);
    expect(courseDelete.ok()).toBe(true);

    await signOut(page);
    await signIn(page, participant);
    await page.goto("/lms/dashboard");
    await expect(page.getByRole("heading", { name: editedCourseTitle, exact: true })).not.toBeVisible();
    await page.goto("/lms/courses");
    await expect(page.getByText(editedCourseTitle, { exact: true })).not.toBeVisible();
  });
});