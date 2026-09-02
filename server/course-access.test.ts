import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";
import test from "node:test";
import type { Server } from "node:http";
import { and, eq, inArray, isNull } from "drizzle-orm";

import { registerRoutes } from "./routes";
import { storage } from "./storage";
import { db } from "./db";
import { applications, cohorts, learningPodMembers, learningPods, users as usersTable } from "@shared/schema";

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
  secondAssignedToA: {
    id: "learner-a-2",
    email: "learner-a-2@example.com",
    firstName: "Learner",
    lastName: "A2",
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
  mentorA: {
    id: "mentor-a",
    email: "mentor-a@example.com",
    firstName: "Mentor",
    lastName: "A",
    role: "mentor",
    isActive: true,
    mustChangePassword: false,
  },
  mentorB: {
    id: "mentor-b",
    email: "mentor-b@example.com",
    firstName: "Mentor",
    lastName: "B",
    role: "mentor",
    isActive: true,
    mustChangePassword: false,
  },
  admin: {
    id: "admin",
    email: "admin@example.com",
    firstName: "Admin",
    lastName: "User",
    role: "admin",
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
  if (userId === users.assignedToA.id || userId === users.secondAssignedToA.id) return cohortA;
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
  replace("getUserByEmail", async (email: string) => (
    Object.values(users).find(user => user.email.toLowerCase() === email.toLowerCase())
  ));
  replace("getCohort", async (cohortId: string) => [cohortA, cohortB].find(cohort => cohort.id === cohortId));
  const acceptedApplications = [
    { id: "application-a", email: users.assignedToA.email, cohortId: cohortA.id, status: "accepted" },
    { id: "application-a-2", email: users.secondAssignedToA.email, cohortId: cohortA.id, status: "accepted" },
    { id: "application-b", email: users.assignedToB.email, cohortId: cohortB.id, status: "accepted" },
  ];
  replace("getApplicationsByStatus", async (status: string) => (
    acceptedApplications.filter(application => application.status === status)
  ));
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
  const enrollmentByKey = new Map<string, Record<string, unknown>>();
  replace("getEnrollment", async (userId: string, courseId: string) => (
    enrollmentByKey.get(`${userId}:${courseId}`)
  ));
  replace("createEnrollment", async (enrollment: Record<string, unknown>) => {
    const created = {
      id: `enrollment-${enrollmentByKey.size + 1}`,
      ...enrollment,
    };
    enrollmentByKey.set(`${enrollment.userId}:${enrollment.courseId}`, created);
    return created;
  });
  replace("getEnrollmentsByUser", async (userId: string) => (
    Array.from(enrollmentByKey.values()).filter(enrollment => enrollment.userId === userId)
  ));

  const podA = {
    id: "pod-a",
    cohortId: cohortA.id,
    name: "Pod A",
    description: "Cohort A pod",
    mentorId: users.mentorA.id,
    status: "active",
  };
  const podB = {
    id: "pod-b",
    cohortId: cohortB.id,
    name: "Pod B",
    description: "Cohort B pod",
    mentorId: users.mentorB.id,
    status: "active",
  };
  const archivedPod = {
    id: "pod-archived",
    cohortId: cohortA.id,
    name: "Archived pod",
    description: null,
    mentorId: users.mentorA.id,
    status: "archived",
  };
  const pods = new Map<string, Record<string, any>>([
    [podA.id, podA],
    [podB.id, podB],
    [archivedPod.id, archivedPod],
  ]);
  const podMembers = new Map<string, Set<string>>([
    [podA.id, new Set([users.assignedToA.id, users.secondAssignedToA.id])],
    [podB.id, new Set([users.assignedToB.id])],
    [archivedPod.id, new Set([users.assignedToA.id])],
  ]);
  const assignments = new Map<string, Record<string, any>>([
    ["individual-a", {
      id: "individual-a",
      podId: podA.id,
      title: "Individual work",
      instructions: "Submit your own work",
      workType: "individual",
      status: "published",
      dueAt: null,
      maxScore: 100,
      createdById: users.admin.id,
    }],
    ["group-a", {
      id: "group-a",
      podId: podA.id,
      title: "Group project",
      instructions: "Submit one project per pod",
      workType: "group",
      status: "published",
      dueAt: null,
      maxScore: 100,
      createdById: users.admin.id,
    }],
  ]);
  const submissions = new Map<string, Record<string, any>>();
  let nextPodId = 1;
  let nextSubmissionId = 1;
  replace("getAllLearningPods", async () => Array.from(pods.values()));
  replace("getLearningPodsByCohort", async (cohortId: string) => (
    Array.from(pods.values()).filter(pod => pod.cohortId === cohortId && pod.status === "active")
  ));
  replace("getLearningPodsByUser", async (userId: string) => (
    Array.from(pods.values()).filter(pod => pod.status === "active" && (
      pod.mentorId === userId || podMembers.get(pod.id)?.has(userId)
    ))
  ));
  replace("getLearningPod", async (podId: string) => pods.get(podId));
  replace("createLearningPod", async (data: Record<string, any>) => {
    const pod = { ...data, id: `created-pod-${nextPodId++}` };
    pods.set(pod.id, pod);
    podMembers.set(pod.id, new Set());
    return pod;
  });
  replace("updateLearningPod", async (podId: string, data: Record<string, any>) => {
    const pod = pods.get(podId);
    if (!pod) return undefined;
    Object.assign(pod, data);
    return pod;
  });
  replace("deleteLearningPod", async (podId: string) => {
    pods.delete(podId);
    podMembers.delete(podId);
  });
  replace("getLearningPodMembers", async (podId: string) => (
    Array.from(podMembers.get(podId) || [], userId => ({ id: `${podId}-${userId}`, podId, userId }))
  ));
  replace("setLearningPodMembers", async (podId: string, userIds: string[]) => {
    podMembers.set(podId, new Set(userIds));
  });
  replace("getLearningPodAssignments", async (podId: string) => (
    Array.from(assignments.values()).filter(assignment => assignment.podId === podId)
  ));
  replace("getLearningPodAssignment", async (assignmentId: string) => assignments.get(assignmentId));
  replace("getLearningPodSubmissions", async (assignmentId: string, podId: string) => (
    Array.from(submissions.values()).filter(submission => (
      submission.assignmentId === assignmentId && submission.podId === podId
    ))
  ));
  replace("getLearningPodSubmissionById", async (submissionId: string) => submissions.get(submissionId));
  replace("getLearningPodSubmission", async (assignmentId: string, podId: string, submitterId?: string) => (
    Array.from(submissions.values()).find(submission => (
      submission.assignmentId === assignmentId &&
      submission.podId === podId &&
      (!submitterId || submission.submitterId === submitterId)
    ))
  ));
  replace("createLearningPodSubmission", async (data: Record<string, any>) => {
    const submission = {
      ...data,
      id: `submission-${nextSubmissionId++}`,
      score: null,
      feedback: null,
      evaluatedById: null,
      evaluatedAt: null,
    };
    submissions.set(submission.id, submission);
    return submission;
  });
  replace("updateLearningPodSubmission", async (submissionId: string, data: Record<string, any>) => {
    const submission = submissions.get(submissionId);
    if (!submission) return undefined;
    Object.assign(submission, data);
    return submission;
  });

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const userId = req.header("x-test-user") || users.assignedToA.id;
    (req as any).session = {
      userId,
      userRole: userForId(userId)?.role || "participant",
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

async function withDatabasePodRoutes<T>(
  adminId: string,
  callback: (baseUrl: string) => Promise<T>,
): Promise<T> {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).session = {
      userId: req.header("x-test-user") || adminId,
      userRole: "admin",
      mustChangePassword: false,
    };
    next();
  });

  const server = await registerRoutes(app);
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => resolve());
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    return await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
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

test("enrollment creation follows the learner's course access and hides restricted enrollment details", async () => {
  await withCourseRoutes(async baseUrl => {
    const enroll = async (userId: string, courseId: string) => request(baseUrl, userId, "/api/enrollments", {
      method: "POST",
      body: JSON.stringify({ userId, courseId }),
    });

    const sharedEnrollment = await enroll(users.assignedToA.id, "course-all");
    assert.equal(sharedEnrollment.status, 201);
    assert.equal(sharedEnrollment.body.courseId, "course-all");

    const assignedEnrollment = await enroll(users.assignedToA.id, "course-a");
    assert.equal(assignedEnrollment.status, 201);
    assert.equal(assignedEnrollment.body.courseId, "course-a");

    for (const [userId, courseId] of [
      [users.assignedToA.id, "course-b"],
      [users.assignedToB.id, "course-a"],
      [users.withoutCohort.id, "course-a"],
    ]) {
      const rejected = await enroll(userId, courseId);
      assert.equal(rejected.status, 404);
      assert.deepEqual(rejected.body, { error: "Course not found" });
      assert.equal(rejected.body.title, undefined);
    }

    const visibleEnrollments = await request(baseUrl, users.assignedToA.id, `/api/enrollments/user/${users.assignedToA.id}`);
    assert.equal(visibleEnrollments.status, 200);
    assert.deepEqual(
      visibleEnrollments.body.map((enrollment: { courseId: string }) => enrollment.courseId).sort(),
      ["course-a", "course-all"],
    );
    assert.equal(visibleEnrollments.body.find((enrollment: { courseId: string }) => enrollment.courseId === "course-a").course.title, "Cohort A course");

    const crossUserEnrollments = await request(baseUrl, users.assignedToB.id, `/api/enrollments/user/${users.assignedToA.id}`);
    assert.equal(crossUserEnrollments.status, 403);
    assert.deepEqual(crossUserEnrollments.body, { error: "Access denied" });
  });
});

test("learners can only access their own active assigned pod", async () => {
  await withCourseRoutes(async baseUrl => {
    const learnerPods = await request(baseUrl, users.assignedToA.id, "/api/learning-pods");
    assert.equal(learnerPods.status, 200);
    assert.deepEqual(learnerPods.body.map((pod: { id: string }) => pod.id), ["pod-a"]);

    const otherCohortPods = await request(baseUrl, users.assignedToB.id, "/api/learning-pods");
    assert.equal(otherCohortPods.status, 200);
    assert.deepEqual(otherCohortPods.body.map((pod: { id: string }) => pod.id), ["pod-b"]);

    const noPod = await request(baseUrl, users.withoutCohort.id, "/api/learning-pods");
    assert.equal(noPod.status, 200);
    assert.deepEqual(noPod.body, []);

    const crossPod = await request(baseUrl, users.assignedToB.id, "/api/learning-pods/pod-a");
    assert.equal(crossPod.status, 404);
    assert.deepEqual(crossPod.body, { error: "Learning pod not found" });

    const archivedPod = await request(baseUrl, users.assignedToA.id, "/api/learning-pods/pod-archived");
    assert.equal(archivedPod.status, 404);
    assert.deepEqual(archivedPod.body, { error: "Learning pod not found" });
  });
});

test("non-members cannot read pod details or submit work", async () => {
  await withCourseRoutes(async baseUrl => {
    const pod = await request(baseUrl, users.assignedToB.id, "/api/learning-pods/pod-a");
    assert.equal(pod.status, 404);

    const submission = await request(
      baseUrl,
      users.assignedToB.id,
      "/api/learning-pods/pod-a/assignments/individual-a/submissions",
      {
        method: "POST",
        body: JSON.stringify({ submissionText: "Cross-pod submission" }),
      },
    );
    assert.equal(submission.status, 404);
    assert.deepEqual(submission.body, { error: "Assignment not found" });
  });
});

test("individual work stays separate while group work is shared by the pod", async () => {
  await withCourseRoutes(async baseUrl => {
    const individualA = await request(
      baseUrl,
      users.assignedToA.id,
      "/api/learning-pods/pod-a/assignments/individual-a/submissions",
      {
        method: "POST",
        body: JSON.stringify({ submissionText: "Learner A's work" }),
      },
    );
    assert.equal(individualA.status, 201);

    const individualA2 = await request(
      baseUrl,
      users.secondAssignedToA.id,
      "/api/learning-pods/pod-a/assignments/individual-a/submissions",
      {
        method: "POST",
        body: JSON.stringify({ submissionText: "Learner A2's work" }),
      },
    );
    assert.equal(individualA2.status, 201);
    assert.notEqual(individualA.body.id, individualA2.body.id);

    const groupA = await request(
      baseUrl,
      users.assignedToA.id,
      "/api/learning-pods/pod-a/assignments/group-a/submissions",
      {
        method: "POST",
        body: JSON.stringify({ submissionUrl: "https://example.com/group-project" }),
      },
    );
    assert.equal(groupA.status, 201);

    const groupA2 = await request(
      baseUrl,
      users.secondAssignedToA.id,
      "/api/learning-pods/pod-a/assignments/group-a/submissions",
      {
        method: "POST",
        body: JSON.stringify({ submissionUrl: "https://example.com/updated-group-project" }),
      },
    );
    assert.equal(groupA2.status, 200);
    assert.equal(groupA2.body.id, groupA.body.id);
    assert.equal(groupA2.body.submitterId, users.secondAssignedToA.id);
    assert.equal(groupA2.body.submissionUrl, "https://example.com/updated-group-project");

    const pod = await request(baseUrl, users.assignedToA.id, "/api/learning-pods/pod-a");
    assert.equal(pod.status, 200);
    const podA2 = await request(baseUrl, users.secondAssignedToA.id, "/api/learning-pods/pod-a");
    assert.equal(podA2.status, 200);
    const individualSubmissions = pod.body.assignments
      .find((assignment: { id: string }) => assignment.id === "individual-a").submissions;
    const individualSubmissionsA2 = podA2.body.assignments
      .find((assignment: { id: string }) => assignment.id === "individual-a").submissions;
    const groupSubmissions = pod.body.assignments
      .find((assignment: { id: string }) => assignment.id === "group-a").submissions;
    assert.deepEqual(individualSubmissions.map((submission: { submitterId: string }) => submission.submitterId), [users.assignedToA.id]);
    assert.deepEqual(individualSubmissionsA2.map((submission: { submitterId: string }) => submission.submitterId), [users.secondAssignedToA.id]);
    assert.equal(groupSubmissions.length, 1);
  });
});

test("only the assigned mentor or an administrator can review pod work", async () => {
  await withCourseRoutes(async baseUrl => {
    const submitted = await request(
      baseUrl,
      users.assignedToA.id,
      "/api/learning-pods/pod-a/assignments/individual-a/submissions",
      {
        method: "POST",
        body: JSON.stringify({ submissionText: "Work to review" }),
      },
    );
    assert.equal(submitted.status, 201);

    const reviewPath = `/api/learning-pods/pod-a/assignments/individual-a/submissions/${submitted.body.id}/review`;
    for (const reviewerId of [users.assignedToA.id, users.mentorB.id]) {
      const rejected = await request(baseUrl, reviewerId, reviewPath, {
        method: "PATCH",
        body: JSON.stringify({ score: 80, feedback: "Looks good" }),
      });
      assert.equal(rejected.status, 403);
    }

    const mentorReview = await request(baseUrl, users.mentorA.id, reviewPath, {
      method: "PATCH",
      body: JSON.stringify({ score: 85, feedback: "Strong analysis" }),
    });
    assert.equal(mentorReview.status, 200);
    assert.equal(mentorReview.body.score, 85);
    assert.equal(mentorReview.body.feedback, "Strong analysis");
    assert.equal(mentorReview.body.evaluatedById, users.mentorA.id);

    const adminReview = await request(baseUrl, users.admin.id, reviewPath, {
      method: "PATCH",
      body: JSON.stringify({ score: 90, feedback: "Approved by admin" }),
    });
    assert.equal(adminReview.status, 200);
    assert.equal(adminReview.body.score, 90);
    assert.equal(adminReview.body.feedback, "Approved by admin");
    assert.equal(adminReview.body.evaluatedById, users.admin.id);
  });
});

test("a participant cannot be active in two pods in the same cohort", async () => {
  await withCourseRoutes(async baseUrl => {
    const duplicateOnCreate = await request(baseUrl, users.admin.id, "/api/admin/learning-pods", {
      method: "POST",
      body: JSON.stringify({
        cohortId: cohortA.id,
        name: "Duplicate pod",
        description: null,
        mentorId: users.mentorA.id,
        status: "active",
        userIds: [users.assignedToA.id],
      }),
    });
    assert.equal(duplicateOnCreate.status, 400);
    assert.deepEqual(duplicateOnCreate.body, {
      error: "A participant can only belong to one active pod in a cohort",
    });

    const duplicateOnReactivation = await request(baseUrl, users.admin.id, "/api/admin/learning-pods/pod-archived", {
      method: "PATCH",
      body: JSON.stringify({ status: "active" }),
    });
    assert.equal(duplicateOnReactivation.status, 400);
    assert.deepEqual(duplicateOnReactivation.body, {
      error: "A participant can only belong to one active pod in a cohort",
    });
  });
});

test("simultaneous pod creation leaves one active assignment and no empty rejected pod", async () => {
  const participantId = randomUUID();
  const mentorOneId = randomUUID();
  const mentorTwoId = randomUUID();
  const adminId = randomUUID();
  const cohortId = randomUUID();
  const applicationId = randomUUID();
  const participantEmail = `${participantId}@example.com`;

  await db.insert(usersTable).values([
    {
      id: participantId,
      email: participantEmail,
      firstName: "Concurrent",
      lastName: "Participant",
      role: "participant",
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: mentorOneId,
      email: `${mentorOneId}@example.com`,
      firstName: "Mentor",
      lastName: "One",
      role: "mentor",
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: mentorTwoId,
      email: `${mentorTwoId}@example.com`,
      firstName: "Mentor",
      lastName: "Two",
      role: "mentor",
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: adminId,
      email: `${adminId}@example.com`,
      firstName: "Pod",
      lastName: "Administrator",
      role: "admin",
      isActive: true,
      mustChangePassword: false,
    },
  ]);
  await db.insert(cohorts).values({
    id: cohortId,
    name: "Concurrent assignment cohort",
    slug: `concurrent-assignment-${cohortId}`,
  });
  await db.insert(applications).values({
    id: applicationId,
    email: participantEmail,
    firstName: "Concurrent",
    lastName: "Participant",
    status: "accepted",
    cohortId,
  });

  try {
    await withDatabasePodRoutes(adminId, async baseUrl => {
      const payload = (name: string, mentorId: string) => ({
        cohortId,
        name,
        description: null,
        mentorId,
        status: "active",
        userIds: [participantId],
      });

      const responses = await Promise.all([
        request(baseUrl, adminId, "/api/admin/learning-pods", {
          method: "POST",
          body: JSON.stringify(payload("Concurrent pod one", mentorOneId)),
        }),
        request(baseUrl, adminId, "/api/admin/learning-pods", {
          method: "POST",
          body: JSON.stringify(payload("Concurrent pod two", mentorTwoId)),
        }),
      ]);

      const successful = responses.filter(response => response.status === 201);
      const rejected = responses.filter(response => response.status === 400);
      assert.equal(successful.length, 1);
      assert.equal(rejected.length, 1);
      assert.deepEqual(rejected[0].body, {
        error: "A participant can only belong to one active pod in a cohort",
      });

      const activeMemberships = await db.select({
        podId: learningPodMembers.podId,
        userId: learningPodMembers.userId,
      })
        .from(learningPodMembers)
        .innerJoin(learningPods, eq(learningPodMembers.podId, learningPods.id))
        .where(and(
          eq(learningPods.cohortId, cohortId),
          eq(learningPods.status, "active"),
          eq(learningPodMembers.userId, participantId),
          isNull(learningPodMembers.removedAt),
        ));
      assert.equal(activeMemberships.length, 1);

      const cohortPods = await db.select({ id: learningPods.id })
        .from(learningPods)
        .where(eq(learningPods.cohortId, cohortId));
      assert.equal(cohortPods.length, 1);
      assert.equal(cohortPods[0].id, activeMemberships[0].podId);
    });
  } finally {
    await db.delete(applications).where(eq(applications.id, applicationId));
    await db.delete(learningPods).where(eq(learningPods.cohortId, cohortId));
    await db.delete(cohorts).where(eq(cohorts.id, cohortId));
    await db.delete(usersTable).where(eq(usersTable.id, participantId));
    await db.delete(usersTable).where(eq(usersTable.id, mentorOneId));
    await db.delete(usersTable).where(eq(usersTable.id, mentorTwoId));
    await db.delete(usersTable).where(eq(usersTable.id, adminId));
  }
});

test("simultaneous auto-distribution creates one complete assignment and reports the losing run", async () => {
  const participantIds = Array.from({ length: 6 }, () => randomUUID());
  const mentorOneId = randomUUID();
  const mentorTwoId = randomUUID();
  const adminId = randomUUID();
  const cohortId = randomUUID();

  await db.insert(usersTable).values([
    ...participantIds.map((id, index) => ({
      id,
      email: `${id}@example.com`,
      firstName: "Auto",
      lastName: `Participant ${index + 1}`,
      role: "participant",
      isActive: true,
      mustChangePassword: false,
    })),
    {
      id: mentorOneId,
      email: `${mentorOneId}@example.com`,
      firstName: "Mentor",
      lastName: "One",
      role: "mentor",
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: mentorTwoId,
      email: `${mentorTwoId}@example.com`,
      firstName: "Mentor",
      lastName: "Two",
      role: "mentor",
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: adminId,
      email: `${adminId}@example.com`,
      firstName: "Pod",
      lastName: "Administrator",
      role: "admin",
      isActive: true,
      mustChangePassword: false,
    },
  ]);
  await db.insert(cohorts).values({
    id: cohortId,
    name: "Concurrent auto-distribution cohort",
    slug: `concurrent-auto-distribution-${cohortId}`,
  });
  await db.insert(applications).values(participantIds.map((id, index) => ({
    id: randomUUID(),
    email: `${id}@example.com`,
    firstName: "Auto",
    lastName: `Participant ${index + 1}`,
    status: "accepted",
    cohortId,
  })));

  try {
    await withDatabasePodRoutes(adminId, async baseUrl => {
      const payload = {
        cohortId,
        podSize: 3,
        mentorIds: [mentorOneId, mentorTwoId],
        namePrefix: "Concurrent auto pod",
      };
      const responses = await Promise.all([
        request(baseUrl, adminId, "/api/admin/learning-pods/auto-distribute", {
          method: "POST",
          body: JSON.stringify(payload),
        }),
        request(baseUrl, adminId, "/api/admin/learning-pods/auto-distribute", {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      ]);

      assert.equal(responses.filter(response => response.status === 201).length, 1);
      const rejected = responses.filter(response => response.status === 409);
      assert.equal(rejected.length, 1);
      assert.deepEqual(rejected[0].body, {
        error: "This cohort is already being distributed. Please wait for the current distribution to finish.",
      });

      const activeMemberships = await db.select({
        podId: learningPodMembers.podId,
        userId: learningPodMembers.userId,
      })
        .from(learningPodMembers)
        .innerJoin(learningPods, eq(learningPodMembers.podId, learningPods.id))
        .where(and(
          eq(learningPods.cohortId, cohortId),
          eq(learningPods.status, "active"),
          isNull(learningPodMembers.removedAt),
        ));
      assert.equal(activeMemberships.length, participantIds.length);
      assert.deepEqual(
        new Set(activeMemberships.map(membership => membership.userId)),
        new Set(participantIds),
      );
      assert.equal(new Set(activeMemberships.map(membership => membership.podId)).size, 2);

      const cohortPods = await db.select({
        id: learningPods.id,
      })
        .from(learningPods)
        .where(eq(learningPods.cohortId, cohortId));
      assert.equal(cohortPods.length, 2);
    });
  } finally {
    await db.delete(learningPods).where(eq(learningPods.cohortId, cohortId));
    await db.delete(applications).where(eq(applications.cohortId, cohortId));
    await db.delete(cohorts).where(eq(cohorts.id, cohortId));
    await db.delete(usersTable).where(inArray(usersTable.id, [
      ...participantIds,
      mentorOneId,
      mentorTwoId,
      adminId,
    ]));
  }
});