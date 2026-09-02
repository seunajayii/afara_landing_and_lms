import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { db } from "../server/db";
import { hashPassword } from "../server/auth";
import {
  applications,
  cohorts,
  courseCohortAssignments,
  courses,
  enrollments,
  certificates,
  lessons,
  lessonProgress,
  modules,
  users,
} from "@shared/schema";
import { eq, inArray, or } from "drizzle-orm";

const fixtureRunId =
  process.env.E2E_RUN_ID?.trim().replace(/[^a-zA-Z0-9_-]/g, "-") ||
  randomBytes(12).toString("hex");
const fixtureNamespace = `e2e-account-switch-${fixtureRunId}`;
export const ACCOUNT_SWITCH_CREDENTIALS_FILE =
  process.env.E2E_CREDENTIALS_FILE ||
  resolve(process.cwd(), `.playwright/e2e-credentials-${fixtureRunId}.json`);

export interface AccountSwitchFixtureManifest {
  namespace: string;
  participantUserId: string;
  superAdminUserId: string;
  participantCohortId: string;
  adminOnlyCohortId: string;
  participantCourseId: string;
  adminCourseId: string;
  participantModuleId: string;
  adminModuleId: string;
  participantLessonId: string;
  adminLessonId: string;
  applicationId: string;
  participantCourseTitle: string;
  adminCourseTitle: string;
}

export interface AccountSwitchCredentials {
  participant: { email: string; password: string };
  superAdmin: { email: string; password: string };
  fixture: AccountSwitchFixtureManifest;
}

function fixtureId(name: string) {
  return `${fixtureNamespace}-${name}`;
}

function buildFixtureManifest(): AccountSwitchFixtureManifest {
  return {
    namespace: fixtureNamespace,
    participantUserId: fixtureId("participant-user"),
    superAdminUserId: fixtureId("super-admin-user"),
    participantCohortId: fixtureId("participant-cohort"),
    adminOnlyCohortId: fixtureId("admin-only-cohort"),
    participantCourseId: fixtureId("participant-course"),
    adminCourseId: fixtureId("admin-course"),
    participantModuleId: fixtureId("participant-module"),
    adminModuleId: fixtureId("admin-module"),
    participantLessonId: fixtureId("participant-lesson"),
    adminLessonId: fixtureId("admin-lesson"),
    applicationId: fixtureId("participant-application"),
    participantCourseTitle: `E2E Participant Course (${fixtureNamespace})`,
    adminCourseTitle: `E2E Admin Course (${fixtureNamespace})`,
  };
}

function assertSafeSeedEnvironment() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The LMS account-switch seed cannot run in production.");
  }
  if (process.env.E2E_SEED_DATABASE !== "true") {
    throw new Error(
      "Set E2E_SEED_DATABASE=true before running the LMS account-switch seed.",
    );
  }
}

function assertFixtureManifest(
  manifest: AccountSwitchFixtureManifest,
): void {
  if (!manifest || typeof manifest.namespace !== "string") {
    throw new Error("Refusing to clean up an invalid LMS fixture manifest.");
  }
  if (
    !manifest.namespace.startsWith("e2e-account-switch-") ||
    !/^[a-zA-Z0-9_-]+$/.test(manifest.namespace)
  ) {
    throw new Error("Refusing to clean up an untrusted LMS fixture namespace.");
  }

  const expectedIds: Record<string, string> = {
    participantUserId: "participant-user",
    superAdminUserId: "super-admin-user",
    participantCohortId: "participant-cohort",
    adminOnlyCohortId: "admin-only-cohort",
    participantCourseId: "participant-course",
    adminCourseId: "admin-course",
    participantModuleId: "participant-module",
    adminModuleId: "admin-module",
    participantLessonId: "participant-lesson",
    adminLessonId: "admin-lesson",
    applicationId: "participant-application",
  };
  if (
    Object.entries(expectedIds).some(
      ([key, suffix]) => manifest[key as keyof AccountSwitchFixtureManifest] !== `${manifest.namespace}-${suffix}`,
    )
  ) {
    throw new Error("Refusing to clean up LMS data outside the fixture namespace.");
  }
}

function writeCredentials(credentials: AccountSwitchCredentials) {
  mkdirSync(dirname(ACCOUNT_SWITCH_CREDENTIALS_FILE), { recursive: true });
  writeFileSync(
    ACCOUNT_SWITCH_CREDENTIALS_FILE,
    `${JSON.stringify(credentials, null, 2)}\n`,
    { mode: 0o600 },
  );
}

export async function seedLmsAccountSwitchData(): Promise<AccountSwitchCredentials> {
  assertSafeSeedEnvironment();

  const now = new Date();
  const participantPassword = `e2e-${randomBytes(24).toString("hex")}`;
  const superAdminPassword = `e2e-${randomBytes(24).toString("hex")}`;
  const fixture = buildFixtureManifest();
  const participantEmail = `${fixture.namespace}-participant@afara.test`;
  const superAdminEmail = `${fixture.namespace}-superadmin@afara.test`;
  const credentials: AccountSwitchCredentials = {
    participant: { email: participantEmail, password: participantPassword },
    superAdmin: { email: superAdminEmail, password: superAdminPassword },
    fixture,
  };

  // Write the manifest before changing the database so a failed setup can
  // still be cleaned up by global teardown.
  writeCredentials(credentials);

  const [participant] = await db
    .insert(users)
    .values({
      id: fixture.participantUserId,
      email: participantEmail,
      passwordHash: await hashPassword(participantPassword),
      firstName: "E2E",
      lastName: "Participant",
      role: "participant",
      isActive: true,
      mustChangePassword: false,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: participantEmail,
        passwordHash: await hashPassword(participantPassword),
        firstName: "E2E",
        lastName: "Participant",
        role: "participant",
        isActive: true,
        mustChangePassword: false,
      },
    })
    .returning();

  const [superAdmin] = await db
    .insert(users)
    .values({
      id: fixture.superAdminUserId,
      email: superAdminEmail,
      passwordHash: await hashPassword(superAdminPassword),
      firstName: "E2E",
      lastName: "Super Admin",
      role: "superadmin",
      isActive: true,
      mustChangePassword: false,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: superAdminEmail,
        passwordHash: await hashPassword(superAdminPassword),
        firstName: "E2E",
        lastName: "Super Admin",
        role: "superadmin",
        isActive: true,
        mustChangePassword: false,
      },
    })
    .returning();

  await db
    .insert(cohorts)
    .values([
      {
        id: fixture.participantCohortId,
        name: `E2E Participant Cohort (${fixture.namespace})`,
        slug: `${fixture.namespace}-participant`,
        displayName: `E2E Participant Cohort (${fixture.namespace})`,
        cohortType: "core",
        status: "open",
        year: now.getFullYear(),
        isActive: true,
        isOpen: true,
      },
      {
        id: fixture.adminOnlyCohortId,
        name: `E2E Admin-only Cohort (${fixture.namespace})`,
        slug: `${fixture.namespace}-admin-only`,
        displayName: `E2E Admin-only Cohort (${fixture.namespace})`,
        cohortType: "sponsored",
        status: "open",
        year: now.getFullYear(),
        isActive: true,
        isOpen: true,
      },
    ])
    .onConflictDoUpdate({
      target: cohorts.id,
      set: {
        status: "open",
        isActive: true,
        isOpen: true,
      },
    });

  await db
    .insert(applications)
    .values({
      id: fixture.applicationId,
      email: participantEmail,
      firstName: "E2E",
      lastName: "Participant",
      status: "accepted",
      cohortId: fixture.participantCohortId,
      currentStep: 0,
      submittedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: applications.id,
      set: {
        email: participantEmail,
        status: "accepted",
        cohortId: fixture.participantCohortId,
        updatedAt: now,
      },
    });

  await db
    .insert(courses)
    .values([
      {
        id: fixture.participantCourseId,
        title: fixture.participantCourseTitle,
        description: `A published course visible to the seeded participant (${fixture.namespace}).`,
        shortDescription: `Participant-visible account-switch fixture (${fixture.namespace}).`,
        instructorId: superAdmin.id,
        durationMinutes: 60,
        status: "published",
        audience: "selected",
        category: "E2E",
        level: "Beginner",
        prerequisites: [],
        learningOutcomes: ["Verify participant course visibility."],
        publishedAt: now,
      },
      {
        id: fixture.adminCourseId,
        title: fixture.adminCourseTitle,
        description: `A second published course visible to the seeded super admin (${fixture.namespace}).`,
        shortDescription: `Admin-visible account-switch fixture (${fixture.namespace}).`,
        instructorId: superAdmin.id,
        durationMinutes: 60,
        status: "published",
        audience: "selected",
        category: "E2E",
        level: "Beginner",
        prerequisites: [],
        learningOutcomes: ["Verify admin course visibility."],
        publishedAt: now,
      },
    ])
    .onConflictDoUpdate({
      target: courses.id,
      set: {
        title: fixture.participantCourseTitle,
        description: `A published course visible to the seeded participant (${fixture.namespace}).`,
        shortDescription: `Participant-visible account-switch fixture (${fixture.namespace}).`,
        instructorId: superAdmin.id,
        durationMinutes: 60,
        status: "published",
        audience: "selected",
        category: "E2E",
        level: "Beginner",
        prerequisites: [],
        learningOutcomes: ["Verify participant course visibility."],
        publishedAt: now,
      },
    });

  await db
      .update(courses)
    .set({
      title: fixture.adminCourseTitle,
      description: `A second published course visible to the seeded super admin (${fixture.namespace}).`,
      shortDescription: `Admin-visible account-switch fixture (${fixture.namespace}).`,
      instructorId: superAdmin.id,
      durationMinutes: 60,
      status: "published",
      audience: "selected",
      category: "E2E",
      level: "Beginner",
      prerequisites: [],
      learningOutcomes: ["Verify admin course visibility."],
      publishedAt: now,
    })
    .where(eq(courses.id, fixture.adminCourseId));

  await db
    .delete(courseCohortAssignments)
    .where(eq(courseCohortAssignments.courseId, fixture.participantCourseId));
  await db
    .delete(courseCohortAssignments)
    .where(eq(courseCohortAssignments.courseId, fixture.adminCourseId));
  await db.insert(courseCohortAssignments).values([
    { courseId: fixture.participantCourseId, cohortId: fixture.participantCohortId },
    { courseId: fixture.adminCourseId, cohortId: fixture.adminOnlyCohortId },
  ]);

  await db
    .insert(modules)
    .values([
      {
        id: fixture.participantModuleId,
        courseId: fixture.participantCourseId,
        title: `Participant Module (${fixture.namespace})`,
        description: `Participant account-switch fixture module (${fixture.namespace}).`,
        orderIndex: 1,
        durationMinutes: 60,
      },
      {
        id: fixture.adminModuleId,
        courseId: fixture.adminCourseId,
        title: `Admin Module (${fixture.namespace})`,
        description: `Admin account-switch fixture module (${fixture.namespace}).`,
        orderIndex: 1,
        durationMinutes: 60,
      },
    ])
    .onConflictDoUpdate({
      target: modules.id,
      set: {
        title: `Participant Module (${fixture.namespace})`,
        description: `Participant account-switch fixture module (${fixture.namespace}).`,
        orderIndex: 1,
        durationMinutes: 60,
      },
    });

  await db
    .update(modules)
    .set({
      title: `Admin Module (${fixture.namespace})`,
      description: `Admin account-switch fixture module (${fixture.namespace}).`,
      orderIndex: 1,
      durationMinutes: 60,
    })
    .where(eq(modules.id, fixture.adminModuleId));

  await db
    .insert(lessons)
    .values([
      {
        id: fixture.participantLessonId,
        moduleId: fixture.participantModuleId,
        title: `Participant Lesson (${fixture.namespace})`,
        description: `Participant account-switch fixture lesson (${fixture.namespace}).`,
        orderIndex: 1,
        lessonType: "text",
        content: "Participant course detail loaded.",
        durationMinutes: 60,
        status: "published",
      },
      {
        id: fixture.adminLessonId,
        moduleId: fixture.adminModuleId,
        title: `Admin Lesson (${fixture.namespace})`,
        description: `Admin account-switch fixture lesson (${fixture.namespace}).`,
        orderIndex: 1,
        lessonType: "text",
        content: "Admin course detail loaded.",
        durationMinutes: 60,
        status: "published",
      },
    ])
    .onConflictDoUpdate({
      target: lessons.id,
      set: {
        title: `Participant Lesson (${fixture.namespace})`,
        description: `Participant account-switch fixture lesson (${fixture.namespace}).`,
        orderIndex: 1,
        lessonType: "text",
        content: "Participant course detail loaded.",
        durationMinutes: 60,
        status: "published",
      },
    });

  await db
    .update(lessons)
    .set({
      title: `Admin Lesson (${fixture.namespace})`,
      description: `Admin account-switch fixture lesson (${fixture.namespace}).`,
      orderIndex: 1,
      lessonType: "text",
      content: "Admin course detail loaded.",
      durationMinutes: 60,
      status: "published",
    })
    .where(eq(lessons.id, fixture.adminLessonId));

  writeCredentials(credentials);

  return credentials;
}

export async function cleanupLmsAccountSwitchData(
  credentials: AccountSwitchCredentials,
): Promise<void> {
  assertSafeSeedEnvironment();
  assertFixtureManifest(credentials.fixture);

  const { fixture } = credentials;
  const userIds = [fixture.participantUserId, fixture.superAdminUserId];
  const courseIds = [fixture.participantCourseId, fixture.adminCourseId];
  const lessonIds = [fixture.participantLessonId, fixture.adminLessonId];

  await db.transaction(async (tx) => {
    // These are the only rows the account-switch check seeds. Delete child
    // rows first so teardown remains safe if a check created progress.
    await tx
      .delete(lessonProgress)
      .where(
        or(
          inArray(lessonProgress.userId, userIds),
          inArray(lessonProgress.lessonId, lessonIds),
        ),
      );
    await tx
      .delete(enrollments)
      .where(
        or(
          inArray(enrollments.userId, userIds),
          inArray(enrollments.courseId, courseIds),
        ),
      );
    await tx
      .delete(certificates)
      .where(
        or(
          inArray(certificates.userId, userIds),
          inArray(certificates.courseId, courseIds),
        ),
      );
    await tx
      .delete(courseCohortAssignments)
      .where(inArray(courseCohortAssignments.courseId, courseIds));
    await tx
      .delete(lessons)
      .where(inArray(lessons.id, lessonIds));
    await tx
      .delete(modules)
      .where(
        inArray(modules.id, [
          fixture.participantModuleId,
          fixture.adminModuleId,
        ]),
      );
    await tx.delete(courses).where(inArray(courses.id, courseIds));
    await tx
      .delete(applications)
      .where(inArray(applications.id, [fixture.applicationId]));
    await tx
      .delete(cohorts)
      .where(
        inArray(cohorts.id, [
          fixture.participantCohortId,
          fixture.adminOnlyCohortId,
        ]),
      );
    await tx.delete(users).where(inArray(users.id, userIds));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedLmsAccountSwitchData()
    .then(() => {
      console.log(`Seeded LMS account-switch data in ${ACCOUNT_SWITCH_CREDENTIALS_FILE}`);
    })
    .catch((error) => {
      console.error("LMS account-switch seed failed:", error);
      process.exitCode = 1;
    });
}