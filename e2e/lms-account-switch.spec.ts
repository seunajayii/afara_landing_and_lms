import { expect, test, type Page } from "@playwright/test";

const participant = {
  email: process.env.E2E_PARTICIPANT_EMAIL,
  password: process.env.E2E_PARTICIPANT_PASSWORD,
};
const superAdmin = {
  email: process.env.E2E_SUPERADMIN_EMAIL,
  password: process.env.E2E_SUPERADMIN_PASSWORD,
};

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByTestId("input-login-email").fill(email);
  await page.getByTestId("input-login-password").fill(password);
  await page.getByTestId("button-login").click();
  await expect(page).not.toHaveURL(/\/login$/);
}

async function getCourses(page: Page) {
  const responsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/courses" &&
      response.request().method() === "GET" &&
      response.ok(),
  );
  await page.goto("/lms/courses");
  return responsePromise.then((response) => response.json() as Promise<Array<{ id: string; title: string; status: string }>>);
}

test.describe("LMS account switching", () => {
  test.skip(
    !participant.email ||
      !participant.password ||
      !superAdmin.email ||
      !superAdmin.password,
    "Set E2E_PARTICIPANT_EMAIL, E2E_PARTICIPANT_PASSWORD, E2E_SUPERADMIN_EMAIL, and E2E_SUPERADMIN_PASSWORD to run the live account-switch check.",
  );

  test("refreshes course lists and details when switching participant to super admin", async ({ page }) => {
    await signIn(page, participant.email!, participant.password!);
    const participantCourses = await getCourses(page);
    expect(participantCourses.length).toBeGreaterThan(0);

    const participantCourse = participantCourses.find((course) => course.status === "published")!;
    await expect(page.getByText(participantCourse.title, { exact: true })).toBeVisible();
    await page.getByText(participantCourse.title, { exact: true }).click();
    await expect(page.getByRole("heading", { name: participantCourse.title, exact: true })).toBeVisible();

    await page.getByTestId("button-logout").click();
    await expect(page).toHaveURL(/\/login$/);

    await signIn(page, superAdmin.email!, superAdmin.password!);
    const administratorCourses = await getCourses(page);
    const publishedAdministratorCourses = administratorCourses.filter((course) => course.status === "published");
    expect(publishedAdministratorCourses.length).toBeGreaterThan(0);

    const visibleCards = page.locator('[data-testid^="card-course-"]');
    await expect(visibleCards).toHaveCount(publishedAdministratorCourses.length);
    for (const course of publishedAdministratorCourses) {
      await expect(page.getByText(course.title, { exact: true })).toBeVisible();
    }

    const administratorCourse =
      publishedAdministratorCourses.find((course) => course.id === participantCourse.id) ||
      publishedAdministratorCourses[0];
    await page.goto(`/lms/courses/${administratorCourse.id}`);
    await expect(page.getByRole("heading", { name: administratorCourse.title, exact: true })).toBeVisible();
    await expect(page.getByText("Course content", { exact: true })).toBeVisible();
  });
});