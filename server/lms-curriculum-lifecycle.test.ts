import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

import { db } from "./db";
import { storage } from "./storage";
import { courses, events, lessons, modules } from "@shared/schema";

type CurriculumFixture = {
  courseId: string;
  moduleId: string;
  lessonId: string;
  eventId: string;
};

async function createFixture(label: string): Promise<CurriculumFixture> {
  const fixture = {
    courseId: `${label}-${randomUUID()}`,
    moduleId: `${label}-${randomUUID()}`,
    lessonId: `${label}-${randomUUID()}`,
    eventId: `${label}-${randomUUID()}`,
  };

  await db.insert(courses).values({
    id: fixture.courseId,
    title: `${label} course`,
    status: "published",
    audience: "all",
  });
  await db.insert(modules).values({
    id: fixture.moduleId,
    courseId: fixture.courseId,
    title: `${label} module`,
    orderIndex: 0,
  });
  await db.insert(events).values({
    id: fixture.eventId,
    title: `${label} event`,
    eventType: "live_session",
    startTime: new Date("2030-05-06T14:30:00.000Z"),
    endTime: new Date("2030-05-06T15:30:00.000Z"),
    durationMinutes: 60,
    meetingLink: "https://example.com/lms-lifecycle",
    visibility: "community",
    status: "published",
  });
  await db.insert(lessons).values({
    id: fixture.lessonId,
    moduleId: fixture.moduleId,
    title: `${label} live class`,
    orderIndex: 0,
    lessonType: "live_session",
    status: "published",
    eventId: fixture.eventId,
  });

  return fixture;
}

async function cleanupFixture(fixture: CurriculumFixture) {
  await db.delete(events).where(eq(events.id, fixture.eventId));
  await db.delete(lessons).where(eq(lessons.id, fixture.lessonId));
  await db.delete(modules).where(eq(modules.id, fixture.moduleId));
  await db.delete(courses).where(eq(courses.id, fixture.courseId));
}

async function eventExists(eventId: string) {
  const [event] = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.id, eventId));
  return Boolean(event);
}

test("deleting a live-class lesson, module, or course removes its linked event", async () => {
  const cases: Array<{
    label: string;
    delete: (fixture: CurriculumFixture) => Promise<void>;
  }> = [
    {
      label: "lesson-delete",
      delete: (fixture) => storage.deleteLesson(fixture.lessonId),
    },
    {
      label: "module-delete",
      delete: (fixture) => storage.deleteModule(fixture.moduleId),
    },
    {
      label: "course-delete",
      delete: (fixture) => storage.deleteCourse(fixture.courseId),
    },
  ];

  for (const testCase of cases) {
    const fixture = await createFixture(testCase.label);
    try {
      assert.equal(await eventExists(fixture.eventId), true);
      await testCase.delete(fixture);
      assert.equal(await eventExists(fixture.eventId), false);
    } finally {
      await cleanupFixture(fixture);
    }
  }
});