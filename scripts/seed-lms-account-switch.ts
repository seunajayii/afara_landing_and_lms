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
  lessons,
  modules,
  users,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export const ACCOUNT_SWITCH_CREDENTIALS_FILE =
  process.env.E2E_CREDENTIALS_FILE ||
  resolve(process.cwd(), ".playwright/e2e-credentials.json");

const participantEmail = "e2e-lms-participant@afara.test";
const superAdminEmail = "e2e-lms-superadmin@afara.test";
const participantCohortId = "e2e-account-switch-participant-cohort";
const adminOnlyCohortId = "e2e-account-switch-admin-only-cohort";
const participantCourseId = "e2e-account-switch-participant-course";
const adminCourseId = "e2e-account-switch-admin-course";
const participantModuleId = "e2e-account-switch-participant-module";
const adminModuleId = "e2e-account-switch-admin-module";
const participantLessonId = "e2e-account-switch-participant-lesson";
const adminLessonId = "e2e-account-switch-admin-lesson";
const applicationId = "e2e-account-switch-participant-application";

export interface AccountSwitchCredentials {
  participant: { email: string; password: string };
  superAdmin: { email: string; password: string };
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

export async function seedLmsAccountSwitchData(): Promise<AccountSwitchCredentials> {
  assertSafeSeedEnvironment();

  const now = new Date();
  const participantPassword = `e2e-${randomBytes(24).toString("hex")}`;
  const superAdminPassword = `e2e-${randomBytes(24).toString("hex")}`;

  const [participant] = await db
    .insert(users)
    .values({
      email: participantEmail,
      passwordHash: await hashPassword(participantPassword),
      firstName: "E2E",
      lastName: "Participant",
      role: "participant",
      isActive: true,
      mustChangePassword: false,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
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
      email: superAdminEmail,
      passwordHash: await hashPassword(superAdminPassword),
      firstName: "E2E",
      lastName: "Super Admin",
      role: "superadmin",
      isActive: true,
      mustChangePassword: false,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
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
        id: participantCohortId,
        name: "E2E Participant Cohort",
        slug: "e2e-account-switch-participant",
        displayName: "E2E Participant Cohort",
        cohortType: "core",
        status: "open",
        year: now.getFullYear(),
        isActive: true,
        isOpen: true,
      },
      {
        id: adminOnlyCohortId,
        name: "E2E Admin-only Cohort",
        slug: "e2e-account-switch-admin-only",
        displayName: "E2E Admin-only Cohort",
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
      id: applicationId,
      email: participantEmail,
      firstName: "E2E",
      lastName: "Participant",
      status: "accepted",
      cohortId: participantCohortId,
      currentStep: 0,
      submittedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: applications.id,
      set: {
        email: participantEmail,
        status: "accepted",
        cohortId: participantCohortId,
        updatedAt: now,
      },
    });

  await db
    .insert(courses)
    .values([
      {
        id: participantCourseId,
        title: "E2E Participant Course",
        description: "A published course visible to the seeded participant.",
        shortDescription: "Participant-visible account-switch fixture.",
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
        id: adminCourseId,
        title: "E2E Admin Course",
        description: "A second published course visible to the seeded super admin.",
        shortDescription: "Admin-visible account-switch fixture.",
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
        title: "E2E Participant Course",
        description: "A published course visible to the seeded participant.",
        shortDescription: "Participant-visible account-switch fixture.",
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
      title: "E2E Admin Course",
      description: "A second published course visible to the seeded super admin.",
      shortDescription: "Admin-visible account-switch fixture.",
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
    .where(eq(courses.id, adminCourseId));

  await db
    .delete(courseCohortAssignments)
    .where(eq(courseCohortAssignments.courseId, participantCourseId));
  await db
    .delete(courseCohortAssignments)
    .where(eq(courseCohortAssignments.courseId, adminCourseId));
  await db.insert(courseCohortAssignments).values([
    { courseId: participantCourseId, cohortId: participantCohortId },
    { courseId: adminCourseId, cohortId: adminOnlyCohortId },
  ]);

  await db
    .insert(modules)
    .values([
      {
        id: participantModuleId,
        courseId: participantCourseId,
        title: "Participant Module",
        description: "Participant account-switch fixture module.",
        orderIndex: 1,
        durationMinutes: 60,
      },
      {
        id: adminModuleId,
        courseId: adminCourseId,
        title: "Admin Module",
        description: "Admin account-switch fixture module.",
        orderIndex: 1,
        durationMinutes: 60,
      },
    ])
    .onConflictDoUpdate({
      target: modules.id,
      set: {
        title: "Participant Module",
        description: "Participant account-switch fixture module.",
        orderIndex: 1,
        durationMinutes: 60,
      },
    });

  await db
    .update(modules)
    .set({
      title: "Admin Module",
      description: "Admin account-switch fixture module.",
      orderIndex: 1,
      durationMinutes: 60,
    })
    .where(eq(modules.id, adminModuleId));

  await db
    .insert(lessons)
    .values([
      {
        id: participantLessonId,
        moduleId: participantModuleId,
        title: "Participant Lesson",
        description: "Participant account-switch fixture lesson.",
        orderIndex: 1,
        lessonType: "text",
        content: "Participant course detail loaded.",
        durationMinutes: 60,
        status: "published",
      },
      {
        id: adminLessonId,
        moduleId: adminModuleId,
        title: "Admin Lesson",
        description: "Admin account-switch fixture lesson.",
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
        title: "Participant Lesson",
        description: "Participant account-switch fixture lesson.",
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
      title: "Admin Lesson",
      description: "Admin account-switch fixture lesson.",
      orderIndex: 1,
      lessonType: "text",
      content: "Admin course detail loaded.",
      durationMinutes: 60,
      status: "published",
    })
    .where(eq(lessons.id, adminLessonId));

  const credentials: AccountSwitchCredentials = {
    participant: { email: participantEmail, password: participantPassword },
    superAdmin: { email: superAdminEmail, password: superAdminPassword },
  };
  mkdirSync(dirname(ACCOUNT_SWITCH_CREDENTIALS_FILE), { recursive: true });
  writeFileSync(
    ACCOUNT_SWITCH_CREDENTIALS_FILE,
    `${JSON.stringify(credentials, null, 2)}\n`,
    { mode: 0o600 },
  );

  return credentials;
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