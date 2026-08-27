import assert from "node:assert/strict";
import express from "express";
import test from "node:test";
import type { Server } from "node:http";

import { registerRoutes } from "./routes";
import { storage } from "./storage";

type StorageMethod = (...args: any[]) => any;

const cohortA = {
  id: "cohort-a",
  name: "Cohort A",
};
const cohortB = {
  id: "cohort-b",
  name: "Cohort B",
};

const users = {
  assignedToA: {
    id: "learner-a",
    email: "learner-a@example.com",
    firstName: "Learner",
    lastName: "A",
    role: "participant",
    isActive: true,
    mustChangePassword: false,
  },
  assignedToB: {
    id: "learner-b",
    email: "learner-b@example.com",
    firstName: "Learner",
    lastName: "B",
    role: "participant",
    isActive: true,
    mustChangePassword: false,
  },
  withoutCohort: {
    id: "learner-no-cohort",
    email: "learner-no-cohort@example.com",
    firstName: "Learner",
    lastName: "No Cohort",
    role: "participant",
    isActive: true,
    mustChangePassword: false,
  },
};

const courses = [
  {
    id: "course-all",
    title: "Shared course",
    description: null,
    status: "published",
    audience: "all",
    durationMinutes: null,
    durationOverrideMinutes: null,
  },
  {
    id: "course-a",
    title: "Cohort A course",
    description: null,
    status: "published",
    audience: "selected",
    durationMinutes: null,
    durationOverrideMinutes: null,
  },
  {
    id: "course-b",
    title: "Cohort B course",
    description: null,
    status: "published",
    audience: "selected",
    durationMinutes: null,
    durationOverrideMinutes: null,
  },
];

const modules = [
  { id: "module-all", courseId: "course-all", title: "Shared module", orderIndex: 0 },
  { id: "module-a", courseId: "course-a", title: "Cohort A module", orderIndex: 0 },
  { id: "module-b", courseId: "course-b", title: "Cohort B module", orderIndex: 0 },
];

const lessons = [
  {
    id: "lesson-all",
    moduleId: "module-all",
    title: "Shared lesson",
    orderIndex: 0,
    lessonType: "text",
    content: "Shared content",
    status: "published",
    resourceId: null,
    durationMinutes: 1,
  },
  {
    id: "lesson-a",
    moduleId: "module-a",
    title: "Cohort A lesson",
    orderIndex: 0,
    lessonType: "text",
    content: "Cohort A content",
    status: "published",
    resourceId: null,
    durationMinutes: 1,
  },
  {
    id: "lesson-b",
    moduleId: "module-b",
    title: "Cohort B lesson",
    orderIndex: 0,
    lessonType: "text",
    content: "Cohort B content",
    status: "published",
    resourceId: null,
    durationMinutes: 1,
  },
];

const protectedVideo = {
  id: "video-a",
  title: "Cohort A protected video",
  description: null,
  resourceType: "video",
  category: null,
  fileUrl: null,
  fileName: "cohort-a.mp4",
  fileSize: 1,
  thumbnailUrl: null,
  downloadCount: 0,
  uploadedById: null,
  visibility: "community",
  status: "published",
  partnerName: null,
  partnerLoginUrl: null,
  partnerLoginUsername: null,
  partnerLoginPassword: null,
  youtubeVideoId: null,
  youtubeUrl: null,
  youtubeThumbnailUrl: null,
  youtubeDurationSeconds: null,
  videoSource: "upload",
  videoStorageKey: "private/cohort-a.mp4",
  videoContentType: "video/mp4",
  videoFileSize: 1,
  createdAt: new Date("2026-08-27T00:00:00.000Z"),
};

const courseById = new Map(courses.map(course => [course.id, course]));
const lessonById = new Map(lessons.map(lesson => [lesson.id, lesson]));

function userForId(userId: string) {
  return Object.values(users).find(user => user.id === userId);
}

function cohortForUser(userId: string) {
  if (userId === users.assignedToA.id) return cohortA;
  if (userId === users.assignedToB.id) return cohortB;
  return undefined;
}

async function withCourseRoutes<T>(
  callback: (baseUrl: string) => Promise<T>,
): Promise<T> {
  const mutableStorage = storage as unknown as Record<string, StorageMethod>;
  const originalMethods = new Map<string, StorageMethod | undefined>();
  const replace = (name: string, implementation: StorageMethod) => {
    if (!originalMethods.has(name)) originalMethods.set(name, mutableStorage[name]);
    mutableStorage[name] = implementation;
  };

  replace("getUser", async (userId: string) => userForId(userId));
  replace("getExpiredPrivateVideoUploads", async () => []);
  replace("getAllCourses", async () => courses);
  replace("getPublishedCourses", async () => courses);
  replace("getCourse", async (courseId: string) => courseById.get(courseId));
  replace("getModulesByCourse", async (courseId: string) => modules.filter(module => module.courseId === courseId));
  replace("getLessonsByModule", async (moduleId: string) => lessons.filter(lesson => lesson.moduleId === moduleId));
  replace("getLesson", async (lessonId: string) => lessonById.get(lessonId));
  replace("getActiveCohortForUser", async (userId: string) => cohortForUser(userId));
  replace("isCourseAssignedToCohort", async (courseId: string, cohortId: string) => (
    (courseId === "course-a" && cohortId === cohortA.id) ||
    (courseId === "course-b" && cohortId === cohortB.id)
  ));
  replace("getCoursesForResource", async (resourceId: string) => (
    resourceId === protectedVideo.id ? [courseById.get("course-a")] : []
  ));
  replace("getResource", async (resourceId: string) => (
    resourceId === protectedVideo.id ? protectedVideo : undefined
  ));
  replace("getLessonProgressByUser", async () => []);
  replace("getLessonProgress", async () => undefined);
  replace("createLessonProgress", async (progress: Record<string, unknown>) => ({
    id: "progress-1",
    ...progress,
  }));

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const userId = req.header("x-test-user") || users.assignedToA.id;
    (req as any).session = {
      userId,
      userRole: "participant",
      mustChangePassword: false,
    };
    next();
  });

  let server: Server | undefined;
  try {
    server = await registerRoutes(app);
    await new Promise<void>((resolve, reject) => {
      server!.once("error", reject);
      server!.listen(0, "127.0.0.1", () => resolve());
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    return await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close(error => error ? reject(error) : resolve());
      });
    }
    for (const [name, implementation] of originalMethods) {
      if (implementation) mutableStorage[name] = implementation;
      else delete mutableStorage[name];
    }
  }
}

async function request(
  baseUrl: string,
  userId: string,
  path: string,
  options: RequestInit = {},
) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "x-test-user": userId,
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const text = await response.text();
  return {
    status: response.status,
    body: text ? JSON.parse(text) : undefined,
  };
}

test("course and lesson routes keep selected cohorts isolated while sharing all-participant courses", async () => {
  await withCourseRoutes(async baseUrl => {
    const cases = [
      {
        userId: users.assignedToA.id,
        visibleSelectedCourse: "course-a",
        visibleSelectedLesson: "lesson-a",
        hiddenSelectedCourse: "course-b",
        hiddenSelectedLesson: "lesson-b",
        visibleSelectedModule: "module-a",
        hiddenSelectedModule: "module-b",
      },
      {
        userId: users.assignedToB.id,
        visibleSelectedCourse: "course-b",
        visibleSelectedLesson: "lesson-b",
        hiddenSelectedCourse: "course-a",
        hiddenSelectedLesson: "lesson-a",
        visibleSelectedModule: "module-b",
        hiddenSelectedModule: "module-a",
      },
      {
        userId: users.withoutCohort.id,
        visibleSelectedCourse: null,
        visibleSelectedLesson: null,
        hiddenSelectedCourse: "course-a",
        hiddenSelectedLesson: "lesson-a",
        visibleSelectedModule: null,
        hiddenSelectedModule: "module-a",
      },
    ];

    for (const testCase of cases) {
      const list = await request(baseUrl, testCase.userId, "/api/courses");
      assert.equal(list.status, 200);
      assert.deepEqual(
        list.body.map((course: { id: string }) => course.id).sort(),
        ["course-all", ...(testCase.visibleSelectedCourse ? [testCase.visibleSelectedCourse] : [])].sort(),
      );

      const sharedCourse = await request(baseUrl, testCase.userId, "/api/courses/course-all");
      assert.equal(sharedCourse.status, 200);
      const sharedLesson = await request(baseUrl, testCase.userId, "/api/lessons/lesson-all");
      assert.equal(sharedLesson.status, 200);

      const accessibleSelectedCourse = testCase.visibleSelectedCourse
        ? await request(baseUrl, testCase.userId, `/api/courses/${testCase.visibleSelectedCourse}`)
        : undefined;
      if (accessibleSelectedCourse) assert.equal(accessibleSelectedCourse.status, 200);
      if (testCase.visibleSelectedModule) {
        const accessibleModules = await request(
          baseUrl,
          testCase.userId,
          `/api/courses/${testCase.visibleSelectedCourse}/modules`,
        );
        assert.equal(accessibleModules.status, 200);
      }
      const accessibleSelectedLesson = testCase.visibleSelectedLesson
        ? await request(baseUrl, testCase.userId, `/api/lessons/${testCase.visibleSelectedLesson}`)
        : undefined;
      if (accessibleSelectedLesson) assert.equal(accessibleSelectedLesson.status, 200);
      if (testCase.visibleSelectedModule) {
        const accessibleModuleLessons = await request(
          baseUrl,
          testCase.userId,
          `/api/modules/${testCase.visibleSelectedModule}/lessons`,
        );
        assert.equal(accessibleModuleLessons.status, 200);
      }

      const selectedCourse = await request(
        baseUrl,
        testCase.userId,
        `/api/courses/${testCase.hiddenSelectedCourse}`,
      );
      assert.equal(selectedCourse.status, 404);
      const hiddenCourse = await request(
        baseUrl,
        testCase.userId,
        `/api/courses/${testCase.hiddenSelectedCourse}/modules`,
      );
      assert.equal(hiddenCourse.status, 404);
      const selectedLesson = await request(
        baseUrl,
        testCase.userId,
        `/api/lessons/${testCase.hiddenSelectedLesson}`,
      );
      assert.equal(selectedLesson.status, 404);
      const hiddenModuleLessons = await request(
        baseUrl,
        testCase.userId,
        `/api/modules/${testCase.hiddenSelectedModule}/lessons`,
      );
      assert.equal(hiddenModuleLessons.status, 404);
    }
  });
});

test("progress writes and protected playback reject a course outside the learner's cohort", async () => {
  await withCourseRoutes(async baseUrl => {
    const assignedProgress = await request(baseUrl, users.assignedToA.id, "/api/progress", {
      method: "POST",
      body: JSON.stringify({ lessonId: "lesson-a", status: "completed" }),
    });
    assert.equal(assignedProgress.status, 201);
    assert.equal(assignedProgress.body.userId, users.assignedToA.id);

    for (const userId of [users.assignedToB.id, users.withoutCohort.id]) {
      const rejectedProgress = await request(baseUrl, userId, "/api/progress", {
        method: "POST",
        body: JSON.stringify({ lessonId: "lesson-a", status: "completed" }),
      });
      assert.equal(rejectedProgress.status, 404);
      assert.equal(rejectedProgress.body.error, "Lesson not available");

      const rejectedPlayback = await request(baseUrl, userId, "/api/resources/video-a/playback");
      assert.equal(rejectedPlayback.status, 403);
      assert.equal(rejectedPlayback.body.error, "Access denied");
    }

    const playback = await request(baseUrl, users.assignedToA.id, "/api/resources/video-a/playback");
    assert.equal(playback.status, 200);
    assert.match(playback.body.playbackUrl, /^\/api\/resources\/video-a\/playback\/stream\?token=/);

    const playbackUrl = new URL(playback.body.playbackUrl, baseUrl);
    const copiedPlayback = await request(
      baseUrl,
      users.assignedToB.id,
      `${playbackUrl.pathname}${playbackUrl.search}`,
    );
    assert.equal(copiedPlayback.status, 403);
    assert.equal(copiedPlayback.body.error, "Access denied");
  });
});