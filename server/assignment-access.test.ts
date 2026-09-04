import assert from "node:assert/strict";
import express from "express";
import test from "node:test";
import type { Server } from "node:http";

import { registerRoutes } from "./routes";
import { storage } from "./storage";

type AnyRecord = Record<string, any>;
type StorageMethod = (...args: any[]) => any;

const cohorts = {
  a: { id: "cohort-a", name: "Cohort A", displayName: "Cohort A" },
  b: { id: "cohort-b", name: "Cohort B", displayName: "Cohort B" },
};

const users = {
  learnerA: { id: "learner-a", role: "participant", email: "learner-a@example.com", isActive: true, mustChangePassword: false },
  learnerB: { id: "learner-b", role: "participant", email: "learner-b@example.com", isActive: true, mustChangePassword: false },
  mentorA: { id: "mentor-a", role: "mentor", email: "mentor-a@example.com", isActive: true, mustChangePassword: false },
  mentorB: { id: "mentor-b", role: "mentor", email: "mentor-b@example.com", isActive: true, mustChangePassword: false },
  facilitatorA: { id: "facilitator-a", role: "facilitator", email: "facilitator-a@example.com", isActive: true, mustChangePassword: false },
  facilitatorB: { id: "facilitator-b", role: "facilitator", email: "facilitator-b@example.com", isActive: true, mustChangePassword: false },
  admin: { id: "admin", role: "admin", email: "admin@example.com", isActive: true, mustChangePassword: false },
};

const pods = {
  a: { id: "pod-a", cohortId: cohorts.a.id, name: "Pod A", mentorId: users.mentorA.id, status: "active" },
  b: { id: "pod-b", cohortId: cohorts.b.id, name: "Pod B", mentorId: users.mentorB.id, status: "active" },
};

const podMembers = new Map([
  [pods.a.id, new Set([users.learnerA.id])],
  [pods.b.id, new Set([users.learnerB.id])],
]);

const courses = [
  {
    id: "course-a",
    title: "Cohort A course",
    audience: "selected",
    status: "published",
    instructorId: users.facilitatorA.id,
  },
  {
    id: "course-b",
    title: "Cohort B course",
    audience: "selected",
    status: "published",
    instructorId: users.facilitatorB.id,
  },
];

const modules = [
  { id: "module-a", courseId: "course-a", title: "Module A" },
  { id: "module-b", courseId: "course-b", title: "Module B" },
];

function target(targetType: string, targetId: string) {
  return { targetType, targetId };
}

function question(id: string, questionType: string, points: number, correctAnswers: string[] = []) {
  return {
    id,
    assignmentId: "",
    prompt: `${id} prompt`,
    questionType,
    options: questionType === "single_choice" ? ["red", "blue"] : [],
    correctAnswers,
    points,
    orderIndex: 0,
  };
}

function makeAssignment(id: string, cohortId: string, title: string, assignmentType: string, status: string) {
  return {
    id,
    cohortId,
    title,
    instructions: `${title} instructions`,
    assignmentType,
    status,
    dueAt: null,
    maxScore: 10,
    passingScore: 7,
    createdById: users.admin.id,
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    updatedAt: new Date("2026-09-01T00:00:00.000Z"),
  };
}

async function withAssignmentRoutes<T>(callback: (baseUrl: string, state: AnyRecord) => Promise<T>): Promise<T> {
  const assignments = new Map<string, AnyRecord>([
    ["cohort-a", makeAssignment("cohort-a", cohorts.a.id, "Cohort A assignment", "reflection", "published")],
    ["pod-a", makeAssignment("pod-a", cohorts.a.id, "Pod A assignment", "submission", "published")],
    ["course-a", makeAssignment("course-a", cohorts.a.id, "Course A assignment", "submission", "published")],
    ["cohort-b", makeAssignment("cohort-b", cohorts.b.id, "Cohort B assignment", "reflection", "published")],
    ["draft-a", makeAssignment("draft-a", cohorts.a.id, "Cohort A draft", "reflection", "draft")],
  ]);
  const targets = new Map<string, AnyRecord[]>([
    ["cohort-a", [target("cohort", cohorts.a.id)]],
    ["pod-a", [target("pod", pods.a.id)]],
    ["course-a", [target("course", courses[0].id)]],
    ["cohort-b", [target("cohort", cohorts.b.id)]],
    ["draft-a", [target("cohort", cohorts.a.id)]],
  ]);
  const questions = new Map<string, AnyRecord[]>([
    ["cohort-a", []],
    ["pod-a", []],
    ["course-a", []],
    ["cohort-b", []],
    ["draft-a", []],
  ]);
  const submissions = new Map<string, AnyRecord>();
  const answers = new Map<string, AnyRecord[]>();
  let nextAssignmentId = 1;
  let nextSubmissionId = 1;
  const mutableStorage = storage as unknown as Record<string, StorageMethod>;
  const originalMethods = new Map<string, StorageMethod | undefined>();
  const replace = (name: string, implementation: StorageMethod) => {
    if (!originalMethods.has(name)) originalMethods.set(name, mutableStorage[name]);
    mutableStorage[name] = implementation;
  };

  const assignmentQuiz = makeAssignment("quiz-a", cohorts.a.id, "Automatic quiz", "quiz", "published");
  assignments.set(assignmentQuiz.id, assignmentQuiz);
  targets.set(assignmentQuiz.id, [target("cohort", cohorts.a.id)]);
  const quizQuestions = [
    { ...question("quiz-q1", "single_choice", 4, ["red"]), assignmentId: assignmentQuiz.id },
    { ...question("quiz-q2", "multiple_choice", 6, ["blue", "green"]), assignmentId: assignmentQuiz.id },
  ];
  quizQuestions[1].options = ["blue", "green", "yellow"];
  questions.set(assignmentQuiz.id, quizQuestions);

  const manual = makeAssignment("manual-a", cohorts.a.id, "Manual assignment", "reflection", "published");
  assignments.set(manual.id, manual);
  targets.set(manual.id, [target("pod", pods.a.id)]);
  const manualQuestion = { ...question("manual-q1", "reflection", 10), assignmentId: manual.id };
  questions.set(manual.id, [manualQuestion]);

  const courseModuleAssignment = makeAssignment("module-a", cohorts.a.id, "Module A assignment", "submission", "published");
  assignments.set(courseModuleAssignment.id, courseModuleAssignment);
  targets.set(courseModuleAssignment.id, [target("module", modules[0].id)]);
  questions.set(courseModuleAssignment.id, []);

  const seededSubmission = {
    id: "manual-submission-a",
    assignmentId: manual.id,
    userId: users.learnerA.id,
    podId: pods.a.id,
    attemptNumber: 1,
    status: "submitted",
    responseText: "Evidence-bearing work",
    links: [],
    fileEvidence: [{ key: "assignment-evidence/private.txt", name: "private.txt", contentType: "text/plain", size: 7 }],
    completedAt: new Date("2026-09-02T00:00:00.000Z"),
    submittedAt: new Date("2026-09-02T00:00:00.000Z"),
    reviewedAt: null,
    score: null,
    passed: null,
    feedback: null,
    internalNotes: "Staff-only note",
    reviewedById: null,
  };
  submissions.set(seededSubmission.id, seededSubmission);
  answers.set(seededSubmission.id, [{
    id: "manual-answer-a",
    submissionId: seededSubmission.id,
    questionId: manualQuestion.id,
    answer: "A thoughtful reflection",
    isCorrect: null,
    score: null,
    feedback: null,
  }]);

  replace("getUser", async (userId: string) => Object.values(users).find((user) => user.id === userId));
  replace("getCohort", async (cohortId: string) => Object.values(cohorts).find((cohort) => cohort.id === cohortId));
  replace("getActiveCohortForUser", async (userId: string) => {
    if (userId === users.learnerA.id || userId === users.mentorA.id || userId === users.facilitatorA.id) return cohorts.a;
    if (userId === users.learnerB.id || userId === users.mentorB.id || userId === users.facilitatorB.id) return cohorts.b;
    return undefined;
  });
  replace("getLearningPod", async (podId: string) => Object.values(pods).find((pod) => pod.id === podId));
  replace("getLearningPodMembers", async (podId: string) => Array.from(podMembers.get(podId) || [], (userId) => ({
    id: `${podId}-${userId}`,
    podId,
    userId,
    removedAt: null,
  })));
  replace("getAllCourses", async () => courses);
  replace("getCourse", async (courseId: string) => courses.find((course) => course.id === courseId));
  replace("getModulesByCourse", async (courseId: string) => modules.filter((module) => module.courseId === courseId));
  replace("isCourseAssignedToCohort", async (courseId: string, cohortId: string) => (
    (courseId === courses[0].id && cohortId === cohorts.a.id) ||
    (courseId === courses[1].id && cohortId === cohorts.b.id)
  ));
  replace("getAssignmentsByCohort", async (cohortId?: string) => (
    Array.from(assignments.values()).filter((assignment) => !cohortId || assignment.cohortId === cohortId)
  ));
  replace("getAssignment", async (assignmentId: string) => assignments.get(assignmentId));
  replace("getAssignmentTargets", async (assignmentId: string) => targets.get(assignmentId) || []);
  replace("replaceAssignmentTargets", async (assignmentId: string, nextTargets: AnyRecord[]) => targets.set(
    assignmentId,
    nextTargets.map(({ assignmentId: _assignmentId, ...assignmentTarget }) => assignmentTarget),
  ));
  replace("getAssignmentQuestions", async (assignmentId: string) => questions.get(assignmentId) || []);
  replace("replaceAssignmentQuestions", async (assignmentId: string, nextQuestions: AnyRecord[]) => {
    const stored = nextQuestions.map((item, index) => ({ ...item, id: item.id || `question-${index + 1}`, assignmentId }));
    questions.set(assignmentId, stored);
    return stored;
  });
  replace("getAssignmentSubmissions", async (assignmentId: string) => (
    Array.from(submissions.values()).filter((submission) => submission.assignmentId === assignmentId)
  ));
  replace("getAssignmentSubmission", async (submissionId: string) => submissions.get(submissionId));
  replace("getLatestAssignmentSubmission", async (assignmentId: string, userId: string) => (
    Array.from(submissions.values())
      .filter((submission) => submission.assignmentId === assignmentId && submission.userId === userId)
      .sort((a, b) => b.attemptNumber - a.attemptNumber)[0]
  ));
  replace("getNextAssignmentAttemptNumber", async (assignmentId: string, userId: string) => {
    const attempts = Array.from(submissions.values())
      .filter((submission) => submission.assignmentId === assignmentId && submission.userId === userId)
      .map((submission) => submission.attemptNumber);
    return (attempts.length ? Math.max(...attempts) : 0) + 1;
  });
  replace("createAssignment", async (data: AnyRecord) => {
    const created = {
      ...data,
      id: `created-assignment-${nextAssignmentId++}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    assignments.set(created.id, created);
    targets.set(created.id, []);
    questions.set(created.id, []);
    return created;
  });
  replace("updateAssignment", async (assignmentId: string, data: AnyRecord) => {
    const assignment = assignments.get(assignmentId);
    if (!assignment) return undefined;
    Object.assign(assignment, data, { updatedAt: new Date() });
    return assignment;
  });
  replace("deleteAssignment", async (assignmentId: string) => {
    assignments.delete(assignmentId);
    targets.delete(assignmentId);
    questions.delete(assignmentId);
  });
  replace("createAssignmentSubmission", async (data: AnyRecord) => {
    const created = {
      ...data,
      id: `submission-${nextSubmissionId++}`,
      attemptNumber: data.attemptNumber || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    submissions.set(created.id, created);
    return created;
  });
  replace("updateAssignmentSubmission", async (submissionId: string, data: AnyRecord) => {
    const submission = submissions.get(submissionId);
    if (!submission) return undefined;
    Object.assign(submission, data, { updatedAt: new Date() });
    return submission;
  });
  replace("getAssignmentAnswers", async (submissionId: string) => answers.get(submissionId) || []);
  replace("replaceAssignmentAnswers", async (submissionId: string, nextAnswers: AnyRecord[]) => {
    const stored = nextAnswers.map((item, index) => ({ ...item, id: `${submissionId}-answer-${index + 1}` }));
    answers.set(submissionId, stored);
    return stored;
  });

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const userId = req.header("x-test-user") || users.learnerA.id;
    const user = Object.values(users).find((candidate) => candidate.id === userId);
    (req as any).session = {
      userId,
      userRole: user?.role || "participant",
      mustChangePassword: false,
      destroy: (callback: () => void) => callback(),
    };
    next();
  });

  let server: Server | undefined;
  try {
    await registerRoutes(app).then((registeredServer) => {
      server = registeredServer;
    });
    await new Promise<void>((resolve, reject) => {
      server!.once("error", reject);
      server!.listen(0, "127.0.0.1", () => resolve());
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    return await callback(`http://127.0.0.1:${address.port}`, {
      assignments,
      targets,
      questions,
      submissions,
      answers,
    });
  } finally {
    if (server) {
      await new Promise<void>((resolve, reject) => server!.close((error) => error ? reject(error) : resolve()));
    }
    for (const [name, implementation] of originalMethods) {
      if (implementation) mutableStorage[name] = implementation;
      else delete mutableStorage[name];
    }
  }
}

async function request(baseUrl: string, userId: string, path: string, options: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "x-test-user": userId,
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const text = await response.text();
  let body: any;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = text;
  }
  return { status: response.status, body };
}

function jsonBody(body: AnyRecord) {
  return { method: "POST", body: JSON.stringify(body) };
}

test("assignment lists and details stay isolated by cohort and pod", async () => {
  await withAssignmentRoutes(async (baseUrl) => {
    const learnerA = await request(baseUrl, users.learnerA.id, "/api/assignments");
    assert.equal(learnerA.status, 200);
    assert.deepEqual(
      learnerA.body.map((assignment: AnyRecord) => assignment.id).sort(),
      ["cohort-a", "course-a", "manual-a", "module-a", "pod-a", "quiz-a"].sort(),
    );
    assert.equal(learnerA.body.find((assignment: AnyRecord) => assignment.id === "quiz-a").questions[0].correctAnswers, undefined);
    assert.equal(learnerA.body.find((assignment: AnyRecord) => assignment.id === "manual-a").submissions[0].internalNotes, undefined);

    const learnerB = await request(baseUrl, users.learnerB.id, "/api/assignments");
    assert.equal(learnerB.status, 200);
    assert.deepEqual(learnerB.body.map((assignment: AnyRecord) => assignment.id), ["cohort-b"]);

    const crossCohortQuery = await request(baseUrl, users.learnerA.id, "/api/assignments?cohortId=cohort-b");
    assert.equal(crossCohortQuery.status, 200);
    assert.deepEqual(crossCohortQuery.body, []);

    for (const assignmentId of ["cohort-b", "draft-a"]) {
      const hidden = await request(baseUrl, users.learnerA.id, `/api/assignments/${assignmentId}`);
      assert.equal(hidden.status, 404);
      assert.deepEqual(hidden.body, { error: "Assignment not found" });
    }

    const ownDetail = await request(baseUrl, users.learnerA.id, "/api/assignments/manual-a");
    assert.equal(ownDetail.status, 200);
    assert.equal(ownDetail.body.submissions.length, 1);
    assert.equal(ownDetail.body.submissions[0].internalNotes, undefined);
    assert.equal(ownDetail.body.submissions[0].reviewedById, undefined);
  });
});

test("staff authoring is limited to assigned contexts and only admins can publish", async () => {
  await withAssignmentRoutes(async (baseUrl) => {
    const assignmentPayload = (cohortId: string, assignmentTargets: AnyRecord[], status = "published") => ({
      cohortId,
      title: "New assignment",
      assignmentType: "reflection",
      status,
      targets: assignmentTargets,
      questions: [],
    });

    const mentorAssignment = await request(
      baseUrl,
      users.mentorA.id,
      "/api/admin/assignments",
      jsonBody(assignmentPayload(cohorts.a.id, [target("pod", pods.a.id)], "published")),
    );
    assert.equal(mentorAssignment.status, 201);
    assert.equal(mentorAssignment.body.status, "draft");

    for (const [assignmentTargets, expectedStatus] of [
      [[target("cohort", cohorts.a.id)], 403],
      [[target("pod", pods.b.id)], 400],
      [[target("pod", pods.a.id), target("cohort", cohorts.a.id)], 403],
    ] as const) {
      const rejected = await request(
        baseUrl,
        users.mentorA.id,
        "/api/admin/assignments",
        jsonBody(assignmentPayload(cohorts.a.id, assignmentTargets)),
      );
      assert.equal(rejected.status, expectedStatus);
    }

    const facilitatorAssignment = await request(
      baseUrl,
      users.facilitatorA.id,
      "/api/admin/assignments",
      jsonBody(assignmentPayload(cohorts.a.id, [target("course", courses[0].id)], "published")),
    );
    assert.equal(facilitatorAssignment.status, 201);
    assert.equal(facilitatorAssignment.body.status, "draft");

    for (const [assignmentTargets, expectedStatus] of [
      [[target("cohort", cohorts.a.id)], 403],
      [[target("course", courses[1].id)], 400],
      [[target("course", courses[0].id), target("cohort", cohorts.a.id)], 403],
      [[target("module", modules[1].id)], 400],
    ] as const) {
      const rejected = await request(
        baseUrl,
        users.facilitatorA.id,
        "/api/admin/assignments",
        jsonBody(assignmentPayload(cohorts.a.id, assignmentTargets)),
      );
      assert.equal(rejected.status, expectedStatus);
    }

    const otherFacilitator = await request(
      baseUrl,
      users.facilitatorB.id,
      "/api/admin/assignments",
      jsonBody(assignmentPayload(cohorts.a.id, [target("course", courses[1].id)])),
    );
    assert.equal(otherFacilitator.status, 400);

    const draftUpdate = await request(baseUrl, users.mentorA.id, "/api/admin/assignments/draft-a", {
      method: "PATCH",
      body: JSON.stringify({ title: "Updated draft" }),
    });
    assert.equal(draftUpdate.status, 403);

    const adminCreate = await request(
      baseUrl,
      users.admin.id,
      "/api/admin/assignments",
      jsonBody(assignmentPayload(cohorts.b.id, [target("cohort", cohorts.b.id)], "published")),
    );
    assert.equal(adminCreate.status, 201);
    assert.equal(adminCreate.body.status, "published");

    const mentorEdit = await request(baseUrl, users.mentorA.id, "/api/admin/assignments/pod-a", {
      method: "PATCH",
      body: JSON.stringify({ title: "Pod A assignment updated" }),
    });
    assert.equal(mentorEdit.status, 200);
    assert.equal(mentorEdit.body.title, "Pod A assignment updated");
    const mentorPublish = await request(baseUrl, users.mentorA.id, "/api/admin/assignments/pod-a", {
      method: "PATCH",
      body: JSON.stringify({ status: "published" }),
    });
    assert.equal(mentorPublish.status, 403);

    const facilitatorEdit = await request(baseUrl, users.facilitatorA.id, "/api/admin/assignments/course-a", {
      method: "PATCH",
      body: JSON.stringify({ title: "Course A assignment updated" }),
    });
    assert.equal(facilitatorEdit.status, 200);
    assert.equal(facilitatorEdit.body.title, "Course A assignment updated");
    const facilitatorScopeChange = await request(baseUrl, users.facilitatorA.id, "/api/admin/assignments/course-a", {
      method: "PATCH",
      body: JSON.stringify({ targets: [target("cohort", cohorts.a.id)] }),
    });
    assert.equal(facilitatorScopeChange.status, 403);

    const nonAdminDelete = await request(baseUrl, users.mentorA.id, `/api/admin/assignments/${adminCreate.body.id}`, {
      method: "DELETE",
    });
    assert.equal(nonAdminDelete.status, 403);
    const adminDelete = await request(baseUrl, users.admin.id, `/api/admin/assignments/${adminCreate.body.id}`, {
      method: "DELETE",
    });
    assert.equal(adminDelete.status, 204);

    const facilitatorList = await request(baseUrl, users.facilitatorA.id, "/api/admin/assignments?cohortId=cohort-a");
    assert.equal(facilitatorList.status, 200);
    assert.deepEqual(
      facilitatorList.body.map((assignment: AnyRecord) => assignment.id),
      ["course-a", "module-a", "created-assignment-2"],
    );
    const mentorList = await request(baseUrl, users.mentorA.id, "/api/admin/assignments?cohortId=cohort-a");
    assert.equal(mentorList.status, 200);
    assert.deepEqual(
      mentorList.body.map((assignment: AnyRecord) => assignment.id),
      ["pod-a", "manual-a", "created-assignment-1"],
    );
  });
});

test("drafts resume, resubmissions get new attempts, and objective quizzes are marked automatically", async () => {
  await withAssignmentRoutes(async (baseUrl) => {
    const draft = await request(baseUrl, users.learnerA.id, "/api/assignments/pod-a/submissions", jsonBody({
      responseText: "First draft",
      submit: false,
    }));
    assert.equal(draft.status, 201);
    assert.equal(draft.body.status, "draft");
    assert.equal(draft.body.attemptNumber, 1);

    const submittedDraft = await request(baseUrl, users.learnerA.id, "/api/assignments/pod-a/submissions", jsonBody({
      responseText: "Final response",
      submit: true,
    }));
    assert.equal(submittedDraft.status, 200);
    assert.equal(submittedDraft.body.id, draft.body.id);
    assert.equal(submittedDraft.body.attemptNumber, 1);
    assert.equal(submittedDraft.body.status, "submitted");

    const resubmission = await request(baseUrl, users.learnerA.id, "/api/assignments/pod-a/submissions", jsonBody({
      responseText: "Second attempt",
      submit: true,
    }));
    assert.equal(resubmission.status, 201);
    assert.equal(resubmission.body.attemptNumber, 2);
    assert.notEqual(resubmission.body.id, draft.body.id);

    const quiz = await request(baseUrl, users.learnerA.id, "/api/assignments/quiz-a/submissions", jsonBody({
      answers: [
        { questionId: "quiz-q1", answer: "red" },
        { questionId: "quiz-q2", answer: ["green", "blue"] },
      ],
      submit: true,
    }));
    assert.equal(quiz.status, 201);
    assert.equal(quiz.body.status, "graded");
    assert.equal(quiz.body.score, 10);
    assert.equal(quiz.body.passed, true);
    assert.equal(quiz.body.answers.every((answer: AnyRecord) => answer.isCorrect), true);

    const foreignAnswer = await request(baseUrl, users.learnerA.id, "/api/assignments/quiz-a/submissions", jsonBody({
      answers: [{ questionId: "manual-q1", answer: "not this assignment" }],
      submit: true,
    }));
    assert.equal(foreignAnswer.status, 400);
    assert.deepEqual(foreignAnswer.body, { error: "One or more answers do not belong to this assignment" });
  });
});

test("only the assigned mentor, scoped facilitator, or administrator can manually grade", async () => {
  await withAssignmentRoutes(async (baseUrl) => {
    const submissionPath = "/api/assignments/manual-a/submissions/manual-submission-a/review";
    for (const reviewerId of [users.learnerA.id, users.mentorB.id, users.facilitatorA.id]) {
      const rejected = await request(baseUrl, reviewerId, submissionPath, {
        method: "PATCH",
        body: JSON.stringify({ score: 8, feedback: "Not your review scope" }),
      });
      assert.equal(rejected.status, 403);
    }

    const mentorReview = await request(baseUrl, users.mentorA.id, submissionPath, {
      method: "PATCH",
      body: JSON.stringify({
        score: 8,
        feedback: "Good work",
        internalNotes: "Keep this private",
        questionReviews: [{ questionId: "manual-q1", score: 8, isCorrect: null, feedback: "Clear reflection" }],
      }),
    });
    assert.equal(mentorReview.status, 200);
    assert.equal(mentorReview.body.status, "graded");
    assert.equal(mentorReview.body.score, 8);
    assert.equal(mentorReview.body.reviewedById, users.mentorA.id);
    assert.equal(mentorReview.body.answers[0].score, 8);

    const adminReview = await request(baseUrl, users.admin.id, submissionPath, {
      method: "PATCH",
      body: JSON.stringify({ score: 9, feedback: "Admin review" }),
    });
    assert.equal(adminReview.status, 200);
    assert.equal(adminReview.body.reviewedById, users.admin.id);

    const tooHigh = await request(baseUrl, users.mentorA.id, submissionPath, {
      method: "PATCH",
      body: JSON.stringify({ score: 11 }),
    });
    assert.equal(tooHigh.status, 400);
    assert.deepEqual(tooHigh.body, { error: "Score cannot exceed 10" });
  });
});

test("assignment evidence is protected by submission ownership and review scope", async () => {
  await withAssignmentRoutes(async (baseUrl) => {
    const evidencePath = "/api/assignment-files/manual-submission-a/0";
    const otherCohort = await request(baseUrl, users.learnerB.id, evidencePath);
    assert.equal(otherCohort.status, 403);
    assert.deepEqual(otherCohort.body, { error: "Access denied" });

    const wrongMentor = await request(baseUrl, users.mentorB.id, evidencePath);
    assert.equal(wrongMentor.status, 403);
    assert.deepEqual(wrongMentor.body, { error: "Access denied" });

    // The owner and assigned reviewer pass authorization; the invalid backing
    // object is then handled as a missing file rather than an access denial.
    const owner = await request(baseUrl, users.learnerA.id, "/api/assignment-files/manual-submission-a/99");
    assert.equal(owner.status, 404);
    assert.deepEqual(owner.body, { error: "File not found" });
    const assignedMentor = await request(baseUrl, users.mentorA.id, "/api/assignment-files/manual-submission-a/99");
    assert.equal(assignedMentor.status, 404);
    assert.deepEqual(assignedMentor.body, { error: "File not found" });
  });
});