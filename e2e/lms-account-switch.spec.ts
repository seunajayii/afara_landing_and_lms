import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Account = { email: string; password: string };
type AccountSwitchCredentials = {
  participant: Account;
  superAdmin: Account;
};

function loadCredentials(): AccountSwitchCredentials | null {
  const credentialsFile =
    process.env.E2E_CREDENTIALS_FILE ||
    resolve(process.cwd(), ".playwright/e2e-credentials.json");
  try {
    return JSON.parse(readFileSync(credentialsFile, "utf8")) as AccountSwitchCredentials;
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

async function getCourses(page: Page) {
  await page.goto("/lms/courses");
  return page.evaluate(async () => {
    const response = await fetch(`/api/courses?e2e=${crypto.randomUUID()}`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!response.ok) throw new Error(`Unable to load courses (${response.status}).`);
    return response.json() as Promise<Array<{ id: string; title: string; status: string }>>;
  });
}

test.describe("LMS account switching", () => {
  test("refreshes course lists and details when switching participant to super admin", async ({
    page,
  }, testInfo) => {
    const credentials = loadCredentials();
    test.skip(
      !credentials,
      "Run npm run test:e2e for the seeded check, or provide the four E2E account variables.",
    );

    const evidence: Record<string, unknown> = {
      direction: "participant-to-super-admin",
      participant: { email: credentials!.participant.email },
      superAdmin: { email: credentials!.superAdmin.email },
      participantCourseList: null,
      administratorCourseList: null,
      participantDetailLoaded: false,
      administratorDetailLoaded: false,
    };

    try {
      await test.step("Load the participant course list and detail", async () => {
        await signIn(page, credentials!.participant.email, credentials!.participant.password);
        const participantCourses = await getCourses(page);
        evidence.participantCourseList = participantCourses.map(({ id, title, status }) => ({
          id,
          title,
          status,
        }));
        expect(participantCourses.length).toBeGreaterThan(0);

        const participantCourse = participantCourses.find((course) => course.status === "published");
        expect(participantCourse).toBeDefined();
        await expect(page.getByText(participantCourse!.title, { exact: true })).toBeVisible();
        await page.getByText(participantCourse!.title, { exact: true }).click();
        await expect(
          page.getByRole("heading", { name: participantCourse!.title, exact: true }),
        ).toBeVisible();
        evidence.participantDetailLoaded = true;
      });

      await test.step("Switch accounts and verify the refreshed administrator list", async () => {
        await page.getByTestId("button-logout").click();
        await expect(page).toHaveURL(/\/login$/);

        await signIn(page, credentials!.superAdmin.email, credentials!.superAdmin.password);
        const administratorCourses = await getCourses(page);
        const publishedAdministratorCourses = administratorCourses.filter(
          (course) => course.status === "published",
        );
        evidence.administratorCourseList = publishedAdministratorCourses.map(
          ({ id, title, status }) => ({ id, title, status }),
        );

        const participantCourseIds = new Set(
          (evidence.participantCourseList as Array<{ id: string }>).map((course) => course.id),
        );
        expect(publishedAdministratorCourses.length).toBeGreaterThan(0);
        expect(publishedAdministratorCourses.map((course) => course.id)).toEqual(
          expect.arrayContaining([...participantCourseIds]),
        );
        expect(publishedAdministratorCourses.length).toBeGreaterThan(participantCourseIds.size);

        const visibleCards = page.locator('[data-testid^="card-course-"]');
        await expect(visibleCards).toHaveCount(publishedAdministratorCourses.length);
        for (const course of publishedAdministratorCourses) {
          await expect(page.getByText(course.title, { exact: true })).toBeVisible();
        }
      });

      await test.step("Load an administrator-only course detail", async () => {
        const participantCourseIds = new Set(
          (evidence.participantCourseList as Array<{ id: string }>).map((course) => course.id),
        );
        const administratorCourses = evidence.administratorCourseList as Array<{
          id: string;
          title: string;
        }>;
        const administratorCourse = administratorCourses.find(
          (course) => !participantCourseIds.has(course.id),
        );
        expect(administratorCourse).toBeDefined();

        await page.goto(`/lms/courses/${administratorCourse!.id}`);
        await expect(
          page.getByRole("heading", { name: administratorCourse!.title, exact: true }),
        ).toBeVisible();
        await expect(page.getByText("Course content", { exact: true })).toBeVisible();
        evidence.administratorDetailLoaded = true;
      });
    } finally {
      await testInfo.attach("account-switch-evidence-participant-to-super-admin.json", {
        body: JSON.stringify(evidence, null, 2),
        contentType: "application/json",
      });
    }
  });

  test("refreshes course lists and details when switching super admin to participant in a fresh session", async ({
    page,
  }, testInfo) => {
    const credentials = loadCredentials();
    test.skip(
      !credentials,
      "Run npm run test:e2e for the seeded check, or provide the four E2E account variables.",
    );

    const evidence: Record<string, unknown> = {
      direction: "super-admin-to-participant",
      participant: { email: credentials!.participant.email },
      superAdmin: { email: credentials!.superAdmin.email },
      administratorCourseList: null,
      participantCourseList: null,
      administratorOnlyCourse: null,
      participantDetailLoaded: false,
    };

    try {
      await test.step("Load the administrator course list in a fresh session", async () => {
        await signIn(page, credentials!.superAdmin.email, credentials!.superAdmin.password);
        const administratorCourses = await getCourses(page);
        const publishedAdministratorCourses = administratorCourses.filter(
          (course) => course.status === "published",
        );
        evidence.administratorCourseList = publishedAdministratorCourses.map(
          ({ id, title, status }) => ({ id, title, status }),
        );

        expect(publishedAdministratorCourses.length).toBeGreaterThan(1);
        const administratorOnlyCourse = publishedAdministratorCourses.find(
          (course) => course.title === "E2E Admin Course",
        );
        expect(administratorOnlyCourse).toBeDefined();
        evidence.administratorOnlyCourse = {
          id: administratorOnlyCourse!.id,
          title: administratorOnlyCourse!.title,
          status: administratorOnlyCourse!.status,
        };
        await expect(
          page.getByText(administratorOnlyCourse!.title, { exact: true }),
        ).toBeVisible();
      });

      await test.step("Switch accounts and verify the participant list is refreshed", async () => {
        await page.getByTestId("button-logout").click();
        await expect(page).toHaveURL(/\/login$/);

        await signIn(page, credentials!.participant.email, credentials!.participant.password);
        const participantCourses = await getCourses(page);
        evidence.participantCourseList = participantCourses.map(({ id, title, status }) => ({
          id,
          title,
          status,
        }));

        const administratorOnlyCourse = evidence.administratorOnlyCourse as {
          id: string;
          title: string;
        };
        expect(participantCourses.length).toBeGreaterThan(0);
        expect(participantCourses.map((course) => course.id)).not.toContain(
          administratorOnlyCourse.id,
        );
        await expect(
          page.getByText(administratorOnlyCourse.title, { exact: true }),
        ).not.toBeVisible();
      });

      await test.step("Load a participant course detail after the reverse switch", async () => {
        const participantCourses = evidence.participantCourseList as Array<{
          id: string;
          title: string;
          status: string;
        }>;
        const participantCourse = participantCourses.find(
          (course) => course.status === "published",
        );
        expect(participantCourse).toBeDefined();

        await page.goto(`/lms/courses/${participantCourse!.id}`);
        await expect(
          page.getByRole("heading", { name: participantCourse!.title, exact: true }),
        ).toBeVisible();
        await expect(page.getByText("Course content", { exact: true })).toBeVisible();
        evidence.participantDetailLoaded = true;
      });
    } finally {
      await testInfo.attach("account-switch-evidence-super-admin-to-participant.json", {
        body: JSON.stringify(evidence, null, 2),
        contentType: "application/json",
      });
    }
  });
});