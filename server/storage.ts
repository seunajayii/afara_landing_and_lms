import { 
  type User, type InsertUser,
  type Profile, type InsertProfile,
  type MentorProfile, type InsertMentorProfile,
  type FacilitatorProfile, type InsertFacilitatorProfile,
  type Course, type InsertCourse,
  type Module, type InsertModule,
  type Lesson, type InsertLesson,
  type Enrollment, type InsertEnrollment,
  type LessonProgress, type InsertLessonProgress,
  type MentorshipRequest, type InsertMentorshipRequest,
  type MentorshipSession, type InsertMentorshipSession,
  type Event, type InsertEvent,
  type EventRegistration, type InsertEventRegistration,
  type Resource, type InsertResource, type PrivateVideoUpload, type ZoomWebhookEvent, type ZoomOAuthConnection,
  type DiscussionThread, type InsertDiscussionThread,
  type DiscussionPost, type InsertDiscussionPost,
  type Certificate, type InsertCertificate,
  type Achievement, type InsertAchievement,
  type Notification, type InsertNotification,
  type NewsletterSubscriber, type InsertNewsletterSubscriber,
  type NewsletterCampaign, type InsertNewsletterCampaign,
  type Application, type InsertApplication,
  type ApplicationEvaluation, type InsertApplicationEvaluation,
  type Cohort, type InsertCohort,
  type LearningPod, type InsertLearningPod,
  type LearningPodMember, type InsertLearningPodMember,
  type LearningPodAssignment, type InsertLearningPodAssignment,
  type LearningPodSubmission, type InsertLearningPodSubmission,
  type CohortParticipant, type InsertCohortParticipant,
  type ProgressMilestone, type InsertProgressMilestone,
  type ProgressReview, type InsertProgressReview,
  type ProgressFeedback, type InsertProgressFeedback,
  users, profiles, mentorProfiles, facilitatorProfiles,
  courses, modules, lessons, enrollments, lessonProgress,
  mentorshipRequests, mentorshipSessions,
  events, eventRegistrations, resources, privateVideoUploads, zoomWebhookEvents, zoomOAuthConnections,
  discussionThreads, discussionPosts, postLikes,
  certificates, achievements, userAchievements, notifications,
  newsletterSubscribers, newsletterCampaigns,
  applications, applicationEvaluations, cohorts, courseCohortAssignments,
  learningPods, learningPodMembers, learningPodAssignments, learningPodSubmissions
  , cohortParticipants, progressMilestones, progressReviews, progressFeedback
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ne, desc, asc, sql, or, inArray, isNull, lt } from "drizzle-orm";
import { randomUUID } from "crypto";

export class LearningPodMembershipConflictError extends Error {
  constructor() {
    super("A participant can only belong to one active pod in a cohort");
    this.name = "LearningPodMembershipConflictError";
  }
}

export class LearningPodDistributionInProgressError extends Error {
  constructor() {
    super("This cohort is already being distributed. Please wait for the current distribution to finish.");
    this.name = "LearningPodDistributionInProgressError";
  }
}

function hasPostgresErrorCode(error: unknown, code: string): boolean {
  const seen = new Set<unknown>();
  let current = error;
  while (typeof current === "object" && current !== null && !seen.has(current)) {
    seen.add(current);
    if ("code" in current && current.code === code) return true;
    current = "cause" in current ? current.cause : undefined;
  }
  return false;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, data: Partial<InsertProfile>): Promise<Profile | undefined>;
  
  getMentorProfile(userId: string): Promise<MentorProfile | undefined>;
  createMentorProfile(profile: InsertMentorProfile): Promise<MentorProfile>;
  updateMentorProfile(userId: string, data: Partial<InsertMentorProfile>): Promise<MentorProfile | undefined>;
  getAllMentors(): Promise<(User & { mentorProfile: MentorProfile; profile: Profile | null })[]>;
  
  getFacilitatorProfile(userId: string): Promise<FacilitatorProfile | undefined>;
  createFacilitatorProfile(profile: InsertFacilitatorProfile): Promise<FacilitatorProfile>;
  updateFacilitatorProfile(userId: string, data: Partial<InsertFacilitatorProfile>): Promise<FacilitatorProfile | undefined>;
  getAllFacilitators(): Promise<(User & { facilitatorProfile: FacilitatorProfile; profile: Profile | null })[]>;
  
  getCourse(id: string): Promise<Course | undefined>;
  getAllCourses(): Promise<Course[]>;
  getPublishedCourses(): Promise<Course[]>;
  getCourseCohortIds(courseId: string): Promise<string[]>;
  setCourseCohorts(courseId: string, cohortIds: string[]): Promise<void>;
  isCourseAssignedToCohort(courseId: string, cohortId: string): Promise<boolean>;
  getActiveCohortForUser(userId: string): Promise<Cohort | undefined>;
  getCoursesForResource(resourceId: string): Promise<Course[]>;
  getCourseForResource(resourceId: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<void>;
  
  getModulesByCourse(courseId: string): Promise<Module[]>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: string, data: Partial<InsertModule>): Promise<Module | undefined>;
  deleteModule(id: string): Promise<void>;
  
  getLessonsByModule(moduleId: string): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: string, data: Partial<InsertLesson>): Promise<Lesson | undefined>;
  deleteLesson(id: string): Promise<void>;
  
  getEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined>;
  getEnrollmentsByUser(userId: string): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: string): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: string, data: Partial<InsertEnrollment>): Promise<Enrollment | undefined>;
  
  getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | undefined>;
  getLessonProgressByUser(userId: string): Promise<LessonProgress[]>;
  createLessonProgress(progress: InsertLessonProgress): Promise<LessonProgress>;
  updateLessonProgress(id: string, data: Partial<InsertLessonProgress>): Promise<LessonProgress | undefined>;
  
  getMentorshipRequest(id: string): Promise<MentorshipRequest | undefined>;
  getMentorshipRequestsByMentee(menteeId: string): Promise<MentorshipRequest[]>;
  getMentorshipRequestsByMentor(mentorId: string): Promise<MentorshipRequest[]>;
  createMentorshipRequest(request: InsertMentorshipRequest): Promise<MentorshipRequest>;
  updateMentorshipRequest(id: string, data: Partial<InsertMentorshipRequest>): Promise<MentorshipRequest | undefined>;
  
  getMentorshipSession(id: string): Promise<MentorshipSession | undefined>;
  getMentorshipSessionsByMentor(mentorId: string): Promise<MentorshipSession[]>;
  getMentorshipSessionsByMentee(menteeId: string): Promise<MentorshipSession[]>;
  createMentorshipSession(session: InsertMentorshipSession): Promise<MentorshipSession>;
  updateMentorshipSession(id: string, data: Partial<InsertMentorshipSession>): Promise<MentorshipSession | undefined>;
  
  getEvent(id: string): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  getUpcomingEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<void>;
  
  getEventRegistration(userId: string, eventId: string): Promise<EventRegistration | undefined>;
  getEventRegistrationsByEvent(eventId: string): Promise<EventRegistration[]>;
  getEventRegistrationsByUser(userId: string): Promise<EventRegistration[]>;
  createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration>;
  updateEventRegistration(id: string, data: Partial<InsertEventRegistration>): Promise<EventRegistration | undefined>;
  
  getResource(id: string): Promise<Resource | undefined>;
  getAllResources(): Promise<Resource[]>;
  getResourcesByCategory(category: string): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: string, data: Partial<InsertResource>): Promise<Resource | undefined>;
  deleteResource(id: string): Promise<void>;
  incrementResourceDownload(id: string): Promise<void>;
  trackPrivateVideoUpload(storageKey: string, uploadedById: string): Promise<PrivateVideoUpload>;
  claimPrivateVideoUpload(storageKey: string, resourceId: string): Promise<void>;
  releasePrivateVideoUpload(storageKey: string, resourceId: string): Promise<void>;
  markPrivateVideoCleanupAttempt(storageKey: string): Promise<void>;
  markPrivateVideoCleanupFailure(storageKey: string): Promise<void>;
  getPrivateVideoUploads(): Promise<PrivateVideoUpload[]>;
  getExpiredPrivateVideoUploads(cutoff: Date): Promise<PrivateVideoUpload[]>;
  getResourceByVideoStorageKey(storageKey: string): Promise<Resource | undefined>;
  removePrivateVideoUpload(storageKey: string): Promise<void>;
  getPrivateVideoUpload(storageKey: string): Promise<PrivateVideoUpload | undefined>;

  recordZoomWebhookEvent(event: {
    eventId: string;
    eventType: string;
    payload: unknown;
  }): Promise<boolean>;
  getRecentZoomWebhookEvents(limit?: number): Promise<ZoomWebhookEvent[]>;
  getZoomWebhookEvent(eventId: string): Promise<ZoomWebhookEvent | undefined>;
  claimZoomWebhookEvent(eventId: string): Promise<ZoomWebhookEvent | undefined>;
  markZoomWebhookEventCompleted(eventId: string): Promise<void>;
  markZoomWebhookEventFailed(eventId: string, error: string): Promise<void>;
  getZoomOAuthConnection(): Promise<ZoomOAuthConnection | undefined>;
  saveZoomOAuthConnection(connection: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: Date;
    scope?: string | null;
    zoomUserId?: string | null;
    zoomUserEmail?: string | null;
  }): Promise<ZoomOAuthConnection>;
  
  getDiscussionThread(id: string): Promise<DiscussionThread | undefined>;
  getAllDiscussionThreads(): Promise<DiscussionThread[]>;
  createDiscussionThread(thread: InsertDiscussionThread): Promise<DiscussionThread>;
  updateDiscussionThread(id: string, data: Partial<InsertDiscussionThread>): Promise<DiscussionThread | undefined>;
  deleteDiscussionThread(id: string): Promise<void>;
  incrementThreadView(id: string): Promise<void>;
  
  getDiscussionPost(id: string): Promise<DiscussionPost | undefined>;
  getDiscussionPostsByThread(threadId: string): Promise<DiscussionPost[]>;
  createDiscussionPost(post: InsertDiscussionPost): Promise<DiscussionPost>;
  updateDiscussionPost(id: string, data: Partial<InsertDiscussionPost>): Promise<DiscussionPost | undefined>;
  deleteDiscussionPost(id: string): Promise<void>;
  
  getCertificate(id: string): Promise<Certificate | undefined>;
  getCertificatesByUser(userId: string): Promise<Certificate[]>;
  getCertificateByCourse(userId: string, courseId: string): Promise<Certificate | undefined>;
  getCertificateByCohort(userId: string, cohortId: string): Promise<Certificate | undefined>;
  getAllCertificates(): Promise<Certificate[]>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  updateCertificate(id: string, data: Partial<InsertCertificate>): Promise<Certificate | undefined>;
  
  getAllAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<Achievement[]>;
  awardAchievement(userId: string, achievementId: string): Promise<void>;
  
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  
  getApplication(id: string): Promise<Application | undefined>;
  getApplicationDraftByEmail(email: string): Promise<Application | undefined>;
  getSubmittedApplicationByEmail(email: string): Promise<Application | undefined>;
  getMostRecentApplicationByEmail(email: string): Promise<Application | undefined>;
  getAllApplications(): Promise<Application[]>;
  getApplicationsByStatus(status: string): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: string, data: Partial<InsertApplication>): Promise<Application | undefined>;
  deleteApplication(id: string): Promise<void>;
  getApplicationEvaluation(applicationId: string): Promise<ApplicationEvaluation | undefined>;
  upsertApplicationEvaluation(data: InsertApplicationEvaluation): Promise<ApplicationEvaluation>;
  getAllApplicationEvaluations(): Promise<ApplicationEvaluation[]>;

  getCohortParticipant(id: string): Promise<CohortParticipant | undefined>;
  getCohortParticipantByUserAndCohort(userId: string, cohortId: string): Promise<CohortParticipant | undefined>;
  getCohortParticipantsByCohort(cohortId: string): Promise<CohortParticipant[]>;
  getCohortParticipantsByUser(userId: string): Promise<CohortParticipant[]>;
  createCohortParticipant(data: InsertCohortParticipant): Promise<CohortParticipant>;
  updateCohortParticipant(id: string, data: Partial<InsertCohortParticipant>): Promise<CohortParticipant | undefined>;
  ensureCohortParticipantFromApplication(application: Application, userId: string): Promise<CohortParticipant | undefined>;
  getProgressMilestones(participantId: string): Promise<ProgressMilestone[]>;
  getProgressMilestone(id: string): Promise<ProgressMilestone | undefined>;
  createProgressMilestone(data: InsertProgressMilestone): Promise<ProgressMilestone>;
  updateProgressMilestone(id: string, data: Partial<InsertProgressMilestone>): Promise<ProgressMilestone | undefined>;
  getProgressReviews(participantId: string): Promise<ProgressReview[]>;
  getProgressReview(participantId: string, reviewType: string): Promise<ProgressReview | undefined>;
  upsertProgressReview(data: InsertProgressReview): Promise<ProgressReview>;
  getProgressFeedback(participantId: string, includeInternal?: boolean): Promise<ProgressFeedback[]>;
  createProgressFeedback(data: InsertProgressFeedback): Promise<ProgressFeedback>;

  getCohort(id: string): Promise<Cohort | undefined>;
  getCohortBySlug(slug: string): Promise<Cohort | undefined>;
  getOpenCohort(): Promise<Cohort | undefined>;
  getOpenCohorts(): Promise<Cohort[]>;
  getAllCohorts(): Promise<Cohort[]>;
  getPublicCohorts(): Promise<Cohort[]>;
  getPrimaryCohort(): Promise<Cohort | undefined>;
  createCohort(data: InsertCohort): Promise<Cohort>;
  updateCohort(id: string, data: Partial<InsertCohort>): Promise<Cohort | undefined>;
  duplicateCohort(id: string, overrides: Partial<InsertCohort>): Promise<Cohort | undefined>;
  setOpenCohort(id: string, open: boolean): Promise<Cohort | undefined>;
  deleteCohort(id: string): Promise<void>;
  assignApplicationToCohort(applicationId: string, cohortId: string | null): Promise<void>;

  getAllLearningPods(): Promise<LearningPod[]>;
  getLearningPodsByCohort(cohortId: string): Promise<LearningPod[]>;
  getLearningPodsByUser(userId: string): Promise<LearningPod[]>;
  getLearningPod(id: string): Promise<LearningPod | undefined>;
  createLearningPod(data: InsertLearningPod): Promise<LearningPod>;
  createLearningPodWithMembers(data: InsertLearningPod, userIds: string[]): Promise<LearningPod>;
  createLearningPodsWithMembers(
    pods: Array<{ data: InsertLearningPod; userIds: string[] }>,
  ): Promise<LearningPod[]>;
  updateLearningPod(id: string, data: Partial<InsertLearningPod>): Promise<LearningPod | undefined>;
  deleteLearningPod(id: string): Promise<void>;
  getLearningPodMembers(podId: string): Promise<LearningPodMember[]>;
  setLearningPodMembers(podId: string, userIds: string[]): Promise<void>;
  getLearningPodAssignments(podId: string): Promise<LearningPodAssignment[]>;
  getLearningPodAssignment(id: string): Promise<LearningPodAssignment | undefined>;
  createLearningPodAssignment(data: InsertLearningPodAssignment): Promise<LearningPodAssignment>;
  updateLearningPodAssignment(id: string, data: Partial<InsertLearningPodAssignment>): Promise<LearningPodAssignment | undefined>;
  deleteLearningPodAssignment(id: string): Promise<void>;
  getLearningPodSubmissions(assignmentId: string, podId: string): Promise<LearningPodSubmission[]>;
  getLearningPodSubmissionById(id: string): Promise<LearningPodSubmission | undefined>;
  getLearningPodSubmission(assignmentId: string, podId: string, submitterId?: string): Promise<LearningPodSubmission | undefined>;
  createLearningPodSubmission(data: InsertLearningPodSubmission): Promise<LearningPodSubmission>;
  updateLearningPodSubmission(id: string, data: Partial<LearningPodSubmission>): Promise<LearningPodSubmission | undefined>;

  getNewsletterSubscriber(id: string): Promise<NewsletterSubscriber | undefined>;
  getNewsletterSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined>;
  getAllNewsletterSubscribers(): Promise<NewsletterSubscriber[]>;
  getActiveNewsletterSubscribers(): Promise<NewsletterSubscriber[]>;
  createNewsletterSubscriber(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber>;
  updateNewsletterSubscriber(id: string, data: Partial<InsertNewsletterSubscriber>): Promise<NewsletterSubscriber | undefined>;
  unsubscribeNewsletter(email: string): Promise<void>;
  
  getNewsletterCampaign(id: string): Promise<NewsletterCampaign | undefined>;
  getAllNewsletterCampaigns(): Promise<NewsletterCampaign[]>;
  createNewsletterCampaign(campaign: InsertNewsletterCampaign): Promise<NewsletterCampaign>;
  updateNewsletterCampaign(id: string, data: Partial<InsertNewsletterCampaign>): Promise<NewsletterCampaign | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    // Step 1: Nullify optional FK references so records remain but lose the user link
    await db.update(courses).set({ instructorId: null }).where(eq(courses.instructorId, id));
    await db.update(events).set({ hostId: null }).where(eq(events.hostId, id));
    await db.update(resources).set({ uploadedById: null }).where(eq(resources.uploadedById, id));
    await db.update(certificates).set({ approvedById: null }).where(eq(certificates.approvedById, id));
    await db.update(newsletterCampaigns).set({ sentById: null }).where(eq(newsletterCampaigns.sentById, id));
    await db.update(applications).set({ reviewedById: null }).where(eq(applications.reviewedById, id));

    // Step 2: Delete post likes by this user
    await db.delete(postLikes).where(eq(postLikes.userId, id));

    // Step 3: Clean up threads authored by this user (delete their posts + likes first, then threads)
    const userThreads = await db.select({ id: discussionThreads.id }).from(discussionThreads).where(eq(discussionThreads.authorId, id));
    if (userThreads.length > 0) {
      const threadIds = userThreads.map(t => t.id);
      const threadPosts = await db.select({ id: discussionPosts.id }).from(discussionPosts).where(inArray(discussionPosts.threadId, threadIds));
      if (threadPosts.length > 0) {
        await db.delete(postLikes).where(inArray(postLikes.postId, threadPosts.map(p => p.id)));
      }
      await db.delete(discussionPosts).where(inArray(discussionPosts.threadId, threadIds));
      await db.delete(discussionThreads).where(eq(discussionThreads.authorId, id));
    }

    // Step 4: Delete posts authored by this user in other threads (and their likes)
    const userPosts = await db.select({ id: discussionPosts.id }).from(discussionPosts).where(eq(discussionPosts.authorId, id));
    if (userPosts.length > 0) {
      await db.delete(postLikes).where(inArray(postLikes.postId, userPosts.map(p => p.id)));
      await db.delete(discussionPosts).where(eq(discussionPosts.authorId, id));
    }

    // Step 5: Delete event registrations
    await db.delete(eventRegistrations).where(eq(eventRegistrations.userId, id));

    // Step 6: Delete mentorship records
    await db.delete(mentorshipSessions).where(or(eq(mentorshipSessions.mentorId, id), eq(mentorshipSessions.menteeId, id)));
    await db.delete(mentorshipRequests).where(or(eq(mentorshipRequests.menteeId, id), eq(mentorshipRequests.mentorId, id)));

    // Step 7: Delete learning progress records
    await db.delete(lessonProgress).where(eq(lessonProgress.userId, id));
    await db.delete(enrollments).where(eq(enrollments.userId, id));

    // Step 8: Delete achievements, notifications, and certificates
    await db.delete(userAchievements).where(eq(userAchievements.userId, id));
    await db.delete(notifications).where(eq(notifications.userId, id));
    await db.delete(certificates).where(eq(certificates.userId, id));

    // Step 9: Delete profile records
    await db.delete(profiles).where(eq(profiles.userId, id));
    await db.delete(mentorProfiles).where(eq(mentorProfiles.userId, id));
    await db.delete(facilitatorProfiles).where(eq(facilitatorProfiles.userId, id));

    // Step 10: Finally delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role as any));
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }

  async updateProfile(userId: string, data: Partial<InsertProfile>): Promise<Profile | undefined> {
    const [updated] = await db.update(profiles).set(data).where(eq(profiles.userId, userId)).returning();
    return updated;
  }

  async getMentorProfile(userId: string): Promise<MentorProfile | undefined> {
    const [profile] = await db.select().from(mentorProfiles).where(eq(mentorProfiles.userId, userId));
    return profile;
  }

  async createMentorProfile(profile: InsertMentorProfile): Promise<MentorProfile> {
    const [newProfile] = await db.insert(mentorProfiles).values(profile).returning();
    return newProfile;
  }

  async updateMentorProfile(userId: string, data: Partial<InsertMentorProfile>): Promise<MentorProfile | undefined> {
    const [updated] = await db.update(mentorProfiles).set(data).where(eq(mentorProfiles.userId, userId)).returning();
    return updated;
  }

  async getAllMentors(): Promise<(User & { mentorProfile: MentorProfile; profile: Profile | null })[]> {
    const mentors = await db.select().from(users).where(eq(users.role, "mentor"));
    const result = [];
    for (const user of mentors) {
      const [mentorProfile] = await db.select().from(mentorProfiles).where(eq(mentorProfiles.userId, user.id));
      const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
      if (mentorProfile) {
        result.push({ ...user, mentorProfile, profile: profile || null });
      }
    }
    return result;
  }

  async getFacilitatorProfile(userId: string): Promise<FacilitatorProfile | undefined> {
    const [profile] = await db.select().from(facilitatorProfiles).where(eq(facilitatorProfiles.userId, userId));
    return profile;
  }

  async createFacilitatorProfile(profile: InsertFacilitatorProfile): Promise<FacilitatorProfile> {
    const [newProfile] = await db.insert(facilitatorProfiles).values(profile).returning();
    return newProfile;
  }

  async updateFacilitatorProfile(userId: string, data: Partial<InsertFacilitatorProfile>): Promise<FacilitatorProfile | undefined> {
    const [updated] = await db.update(facilitatorProfiles).set(data).where(eq(facilitatorProfiles.userId, userId)).returning();
    return updated;
  }

  async getAllFacilitators(): Promise<(User & { facilitatorProfile: FacilitatorProfile; profile: Profile | null })[]> {
    const facilitators = await db.select().from(users).where(eq(users.role, "facilitator"));
    const result = [];
    for (const user of facilitators) {
      const [facilitatorProfile] = await db.select().from(facilitatorProfiles).where(eq(facilitatorProfiles.userId, user.id));
      const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
      if (facilitatorProfile) {
        result.push({ ...user, facilitatorProfile, profile: profile || null });
      }
    }
    return result;
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getAllCourses(): Promise<Course[]> {
    return db.select().from(courses).orderBy(desc(courses.createdAt));
  }

  async getPublishedCourses(): Promise<Course[]> {
    return db.select().from(courses).where(eq(courses.status, "published")).orderBy(desc(courses.createdAt));
  }

  async getCourseCohortIds(courseId: string): Promise<string[]> {
    const assignments = await db.select({ cohortId: courseCohortAssignments.cohortId })
      .from(courseCohortAssignments)
      .where(eq(courseCohortAssignments.courseId, courseId));
    return assignments.map((assignment) => assignment.cohortId);
  }

  async setCourseCohorts(courseId: string, cohortIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(courseCohortAssignments).where(eq(courseCohortAssignments.courseId, courseId));
      if (cohortIds.length > 0) {
        await tx.insert(courseCohortAssignments).values(
          cohortIds.map((cohortId) => ({ courseId, cohortId })),
        );
      }
    });
  }

  async isCourseAssignedToCohort(courseId: string, cohortId: string): Promise<boolean> {
    const [assignment] = await db.select({ id: courseCohortAssignments.id })
      .from(courseCohortAssignments)
      .where(and(
        eq(courseCohortAssignments.courseId, courseId),
        eq(courseCohortAssignments.cohortId, cohortId),
      ))
      .limit(1);
    return Boolean(assignment);
  }

  async getActiveCohortForUser(userId: string): Promise<Cohort | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    const [result] = await db.select({ cohort: cohorts })
      .from(applications)
      .innerJoin(cohorts, eq(applications.cohortId, cohorts.id))
      .where(and(
        sql`lower(${applications.email}) = ${user.email.toLowerCase()}`,
        eq(applications.status, "accepted"),
      ))
      .orderBy(sql`coalesce(${applications.updatedAt}, ${applications.createdAt}) DESC`)
      .limit(1);
    return result?.cohort;
  }

  async getCourseForResource(resourceId: string): Promise<Course | undefined> {
    const results = await this.getCoursesForResource(resourceId);
    return results[0];
  }

  async getCoursesForResource(resourceId: string): Promise<Course[]> {
    const results = await db.select({ course: courses })
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(courses, eq(modules.courseId, courses.id))
      .where(eq(lessons.resourceId, resourceId))
      .orderBy(desc(courses.createdAt));
    return results.map((result) => result.course);
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updated] = await db.update(courses).set(data).where(eq(courses.id, id)).returning();
    return updated;
  }

  async deleteCourse(id: string): Promise<void> {
    const courseModules = await db.select({ id: modules.id }).from(modules).where(eq(modules.courseId, id));
    const moduleIds = courseModules.map((module) => module.id);
    if (moduleIds.length > 0) {
      const courseLessons = await db.select({ id: lessons.id }).from(lessons).where(inArray(lessons.moduleId, moduleIds));
      const lessonIds = courseLessons.map((lesson) => lesson.id);
      if (lessonIds.length > 0) {
        await db.delete(lessonProgress).where(inArray(lessonProgress.lessonId, lessonIds));
        await db.delete(lessons).where(inArray(lessons.id, lessonIds));
      }
      await db.delete(modules).where(inArray(modules.id, moduleIds));
    }
    await db.delete(certificates).where(eq(certificates.courseId, id));
    await db.delete(enrollments).where(eq(enrollments.courseId, id));
    await db.delete(courses).where(eq(courses.id, id));
  }

  async getModulesByCourse(courseId: string): Promise<Module[]> {
    return db.select().from(modules).where(eq(modules.courseId, courseId)).orderBy(asc(modules.orderIndex));
  }

  async createModule(module: InsertModule): Promise<Module> {
    const [newModule] = await db.insert(modules).values(module).returning();
    return newModule;
  }

  async updateModule(id: string, data: Partial<InsertModule>): Promise<Module | undefined> {
    const [updated] = await db.update(modules).set(data).where(eq(modules.id, id)).returning();
    return updated;
  }

  async deleteModule(id: string): Promise<void> {
    const moduleLessons = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.moduleId, id));
    const lessonIds = moduleLessons.map((lesson) => lesson.id);
    if (lessonIds.length > 0) {
      await db.delete(lessonProgress).where(inArray(lessonProgress.lessonId, lessonIds));
      await db.delete(lessons).where(inArray(lessons.id, lessonIds));
    }
    await db.delete(modules).where(eq(modules.id, id));
  }

  async getLessonsByModule(moduleId: string): Promise<Lesson[]> {
    return db.select().from(lessons).where(eq(lessons.moduleId, moduleId)).orderBy(asc(lessons.orderIndex));
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [newLesson] = await db.insert(lessons).values(lesson).returning();
    return newLesson;
  }

  async updateLesson(id: string, data: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const [updated] = await db.update(lessons).set(data).where(eq(lessons.id, id)).returning();
    return updated;
  }

  async deleteLesson(id: string): Promise<void> {
    await db.delete(lessonProgress).where(eq(lessonProgress.lessonId, id));
    await db.delete(lessons).where(eq(lessons.id, id));
  }

  async getEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
    return enrollment;
  }

  async getEnrollmentsByUser(userId: string): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.userId, userId));
  }

  async getEnrollmentsByCourse(courseId: string): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db.insert(enrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async updateEnrollment(id: string, data: Partial<InsertEnrollment>): Promise<Enrollment | undefined> {
    const [updated] = await db.update(enrollments).set(data).where(eq(enrollments.id, id)).returning();
    return updated;
  }

  async getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | undefined> {
    const [progress] = await db.select().from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)));
    return progress;
  }

  async getLessonProgressByUser(userId: string): Promise<LessonProgress[]> {
    return db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId));
  }

  async createLessonProgress(progress: InsertLessonProgress): Promise<LessonProgress> {
    const [newProgress] = await db.insert(lessonProgress).values(progress).returning();
    return newProgress;
  }

  async updateLessonProgress(id: string, data: Partial<InsertLessonProgress>): Promise<LessonProgress | undefined> {
    const [updated] = await db.update(lessonProgress).set(data).where(eq(lessonProgress.id, id)).returning();
    return updated;
  }

  async getMentorshipRequest(id: string): Promise<MentorshipRequest | undefined> {
    const [request] = await db.select().from(mentorshipRequests).where(eq(mentorshipRequests.id, id));
    return request;
  }

  async getMentorshipRequestsByMentee(menteeId: string): Promise<MentorshipRequest[]> {
    return db.select().from(mentorshipRequests).where(eq(mentorshipRequests.menteeId, menteeId));
  }

  async getMentorshipRequestsByMentor(mentorId: string): Promise<MentorshipRequest[]> {
    return db.select().from(mentorshipRequests).where(eq(mentorshipRequests.mentorId, mentorId));
  }

  async createMentorshipRequest(request: InsertMentorshipRequest): Promise<MentorshipRequest> {
    const [newRequest] = await db.insert(mentorshipRequests).values(request).returning();
    return newRequest;
  }

  async updateMentorshipRequest(id: string, data: Partial<InsertMentorshipRequest>): Promise<MentorshipRequest | undefined> {
    const [updated] = await db.update(mentorshipRequests).set(data).where(eq(mentorshipRequests.id, id)).returning();
    return updated;
  }

  async getMentorshipSession(id: string): Promise<MentorshipSession | undefined> {
    const [session] = await db.select().from(mentorshipSessions).where(eq(mentorshipSessions.id, id));
    return session;
  }

  async getMentorshipSessionsByMentor(mentorId: string): Promise<MentorshipSession[]> {
    return db.select().from(mentorshipSessions).where(eq(mentorshipSessions.mentorId, mentorId)).orderBy(desc(mentorshipSessions.scheduledAt));
  }

  async getMentorshipSessionsByMentee(menteeId: string): Promise<MentorshipSession[]> {
    return db.select().from(mentorshipSessions).where(eq(mentorshipSessions.menteeId, menteeId)).orderBy(desc(mentorshipSessions.scheduledAt));
  }

  async createMentorshipSession(session: InsertMentorshipSession): Promise<MentorshipSession> {
    const [newSession] = await db.insert(mentorshipSessions).values(session).returning();
    return newSession;
  }

  async updateMentorshipSession(id: string, data: Partial<InsertMentorshipSession>): Promise<MentorshipSession | undefined> {
    const [updated] = await db.update(mentorshipSessions).set(data).where(eq(mentorshipSessions.id, id)).returning();
    return updated;
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getAllEvents(): Promise<Event[]> {
    return db.select().from(events).orderBy(desc(events.startTime));
  }

  async getUpcomingEvents(): Promise<Event[]> {
    return db.select().from(events)
      .where(eq(events.status, "published"))
      .orderBy(asc(events.startTime));
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updated] = await db.update(events).set(data).where(eq(events.id, id)).returning();
    return updated;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async getEventRegistration(userId: string, eventId: string): Promise<EventRegistration | undefined> {
    const [registration] = await db.select().from(eventRegistrations)
      .where(and(eq(eventRegistrations.userId, userId), eq(eventRegistrations.eventId, eventId)));
    return registration;
  }

  async getEventRegistrationsByEvent(eventId: string): Promise<EventRegistration[]> {
    return db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, eventId));
  }

  async getEventRegistrationsByUser(userId: string): Promise<EventRegistration[]> {
    return db.select().from(eventRegistrations).where(eq(eventRegistrations.userId, userId));
  }

  async createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration> {
    const [newRegistration] = await db.insert(eventRegistrations).values(registration).returning();
    return newRegistration;
  }

  async updateEventRegistration(id: string, data: Partial<InsertEventRegistration>): Promise<EventRegistration | undefined> {
    const [updated] = await db.update(eventRegistrations).set(data).where(eq(eventRegistrations.id, id)).returning();
    return updated;
  }

  async getResource(id: string): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }

  async getAllResources(): Promise<Resource[]> {
    return db.select().from(resources).orderBy(desc(resources.createdAt));
  }

  async getResourcesByCategory(category: string): Promise<Resource[]> {
    return db.select().from(resources)
      .where(eq(resources.category, category))
      .orderBy(desc(resources.createdAt));
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db.insert(resources).values(resource).returning();
    return newResource;
  }

  async updateResource(id: string, data: Partial<InsertResource>): Promise<Resource | undefined> {
    const [updated] = await db.update(resources).set(data).where(eq(resources.id, id)).returning();
    return updated;
  }

  async deleteResource(id: string): Promise<void> {
    await db.delete(resources).where(eq(resources.id, id));
  }

  async trackPrivateVideoUpload(storageKey: string, uploadedById: string | null): Promise<PrivateVideoUpload> {
    const [upload] = await db.insert(privateVideoUploads)
      .values({ storageKey, uploadedById })
      .onConflictDoNothing({ target: privateVideoUploads.storageKey })
      .returning();
    if (upload) return upload;
    const existing = await this.getPrivateVideoUpload(storageKey);
    if (!existing) throw new Error("Private video upload could not be tracked.");
    return existing;
  }

  async claimPrivateVideoUpload(storageKey: string, resourceId: string): Promise<void> {
    await db.update(privateVideoUploads)
      .set({ resourceId, cleanupRequestedAt: null, cleanupStatus: "active" })
      .where(and(
        eq(privateVideoUploads.storageKey, storageKey),
        isNull(privateVideoUploads.resourceId),
      ));
  }

  async releasePrivateVideoUpload(storageKey: string, resourceId: string): Promise<void> {
    await db.update(privateVideoUploads)
      .set({ resourceId: null, cleanupRequestedAt: new Date(), cleanupStatus: "pending" })
      .where(and(
        eq(privateVideoUploads.storageKey, storageKey),
        or(
          eq(privateVideoUploads.resourceId, resourceId),
          isNull(privateVideoUploads.resourceId),
        ),
      ));
  }

  async markPrivateVideoCleanupAttempt(storageKey: string): Promise<void> {
    await db.update(privateVideoUploads)
      .set({
        cleanupStatus: "pending",
        lastCleanupAttemptAt: new Date(),
        cleanupAttemptCount: sql`${privateVideoUploads.cleanupAttemptCount} + 1`,
      })
      .where(eq(privateVideoUploads.storageKey, storageKey));
  }

  async markPrivateVideoCleanupFailure(storageKey: string): Promise<void> {
    await db.update(privateVideoUploads)
      .set({ cleanupStatus: "failed" })
      .where(eq(privateVideoUploads.storageKey, storageKey));
  }

  async getPrivateVideoUploads(): Promise<PrivateVideoUpload[]> {
    return db.select().from(privateVideoUploads);
  }

  async getExpiredPrivateVideoUploads(cutoff: Date): Promise<PrivateVideoUpload[]> {
    return db.select().from(privateVideoUploads).where(and(
      isNull(privateVideoUploads.resourceId),
      lt(privateVideoUploads.createdAt, cutoff),
      ne(privateVideoUploads.cleanupStatus, "removed"),
    ));
  }

  async getResourceByVideoStorageKey(storageKey: string): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources)
      .where(eq(resources.videoStorageKey, storageKey));
    return resource;
  }

  async removePrivateVideoUpload(storageKey: string): Promise<void> {
    await db.update(privateVideoUploads)
      .set({ cleanupStatus: "removed", resourceId: null })
      .where(eq(privateVideoUploads.storageKey, storageKey));
  }

  async getPrivateVideoUpload(storageKey: string): Promise<PrivateVideoUpload | undefined> {
    const [upload] = await db.select().from(privateVideoUploads)
      .where(eq(privateVideoUploads.storageKey, storageKey));
    return upload;
  }

  async recordZoomWebhookEvent(event: {
    eventId: string;
    eventType: string;
    payload: unknown;
  }): Promise<boolean> {
    const inserted = await db.insert(zoomWebhookEvents)
      .values({
        eventId: event.eventId,
        eventType: event.eventType,
        payload: event.payload,
      })
      .onConflictDoNothing({ target: zoomWebhookEvents.eventId })
      .returning({ id: zoomWebhookEvents.id });
    return inserted.length > 0;
  }

  async getRecentZoomWebhookEvents(limit = 50): Promise<ZoomWebhookEvent[]> {
    const safeLimit = Math.max(1, Math.min(Math.floor(limit), 100));
    return db.select().from(zoomWebhookEvents)
      .orderBy(desc(zoomWebhookEvents.receivedAt))
      .limit(safeLimit);
  }

  async getZoomWebhookEvent(eventId: string): Promise<ZoomWebhookEvent | undefined> {
    const [event] = await db.select().from(zoomWebhookEvents)
      .where(eq(zoomWebhookEvents.eventId, eventId));
    return event;
  }

  async claimZoomWebhookEvent(eventId: string): Promise<ZoomWebhookEvent | undefined> {
    const staleProcessingCutoff = new Date(Date.now() - 10 * 60 * 1000);
    const [claimed] = await db.update(zoomWebhookEvents)
      .set({
        status: "processing",
        processingStartedAt: new Date(),
        error: null,
      })
      .where(and(
        eq(zoomWebhookEvents.eventId, eventId),
        or(
          inArray(zoomWebhookEvents.status, ["received", "failed"]),
          and(
            eq(zoomWebhookEvents.status, "processing"),
            or(
              isNull(zoomWebhookEvents.processingStartedAt),
              lt(zoomWebhookEvents.processingStartedAt, staleProcessingCutoff),
            ),
          ),
        ),
      ))
      .returning();
    return claimed;
  }

  async markZoomWebhookEventCompleted(eventId: string): Promise<void> {
    await db.update(zoomWebhookEvents)
      .set({
        status: "completed",
        processedAt: new Date(),
        processingStartedAt: null,
        error: null,
      })
      .where(eq(zoomWebhookEvents.eventId, eventId));
  }

  async markZoomWebhookEventFailed(eventId: string, error: string): Promise<void> {
    await db.update(zoomWebhookEvents)
      .set({
        status: "failed",
        processingStartedAt: null,
        error: error.slice(0, 2000),
      })
      .where(eq(zoomWebhookEvents.eventId, eventId));
  }

  async getZoomOAuthConnection(): Promise<ZoomOAuthConnection | undefined> {
    const [connection] = await db.select().from(zoomOAuthConnections)
      .where(eq(zoomOAuthConnections.id, "primary"));
    return connection;
  }

  async saveZoomOAuthConnection(connection: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: Date;
    scope?: string | null;
    zoomUserId?: string | null;
    zoomUserEmail?: string | null;
  }): Promise<ZoomOAuthConnection> {
    const [saved] = await db.insert(zoomOAuthConnections)
      .values({
        id: "primary",
        ...connection,
      })
      .onConflictDoUpdate({
        target: zoomOAuthConnections.id,
        set: {
          accessToken: connection.accessToken,
          refreshToken: connection.refreshToken,
          accessTokenExpiresAt: connection.accessTokenExpiresAt,
          scope: connection.scope ?? null,
          zoomUserId: connection.zoomUserId ?? null,
          zoomUserEmail: connection.zoomUserEmail ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();
    return saved;
  }

  async incrementResourceDownload(id: string): Promise<void> {
    const resource = await this.getResource(id);
    if (resource) {
      await db.update(resources).set({ downloadCount: (resource.downloadCount || 0) + 1 }).where(eq(resources.id, id));
    }
  }

  async getDiscussionThread(id: string): Promise<DiscussionThread | undefined> {
    const [thread] = await db.select().from(discussionThreads).where(eq(discussionThreads.id, id));
    return thread;
  }

  async getAllDiscussionThreads(): Promise<DiscussionThread[]> {
    return db.select().from(discussionThreads).orderBy(desc(discussionThreads.isPinned), desc(discussionThreads.createdAt));
  }

  async createDiscussionThread(thread: InsertDiscussionThread): Promise<DiscussionThread> {
    const [newThread] = await db.insert(discussionThreads).values(thread).returning();
    return newThread;
  }

  async updateDiscussionThread(id: string, data: Partial<InsertDiscussionThread>): Promise<DiscussionThread | undefined> {
    const [updated] = await db.update(discussionThreads).set({ ...data, updatedAt: new Date() }).where(eq(discussionThreads.id, id)).returning();
    return updated;
  }

  async deleteDiscussionThread(id: string): Promise<void> {
    // Delete child posts first to avoid FK constraint violation
    await db.delete(discussionPosts).where(eq(discussionPosts.threadId, id));
    await db.delete(discussionThreads).where(eq(discussionThreads.id, id));
  }

  async incrementThreadView(id: string): Promise<void> {
    const thread = await this.getDiscussionThread(id);
    if (thread) {
      await db.update(discussionThreads).set({ viewCount: (thread.viewCount || 0) + 1 }).where(eq(discussionThreads.id, id));
    }
  }

  async getDiscussionPost(id: string): Promise<DiscussionPost | undefined> {
    const [post] = await db.select().from(discussionPosts).where(eq(discussionPosts.id, id));
    return post;
  }

  async getDiscussionPostsByThread(threadId: string): Promise<DiscussionPost[]> {
    return db.select().from(discussionPosts).where(eq(discussionPosts.threadId, threadId)).orderBy(asc(discussionPosts.createdAt));
  }

  async createDiscussionPost(post: InsertDiscussionPost): Promise<DiscussionPost> {
    const [newPost] = await db.insert(discussionPosts).values(post).returning();
    const thread = await this.getDiscussionThread(post.threadId);
    if (thread) {
      await db.update(discussionThreads).set({ replyCount: (thread.replyCount || 0) + 1 }).where(eq(discussionThreads.id, post.threadId));
    }
    return newPost;
  }

  async updateDiscussionPost(id: string, data: Partial<InsertDiscussionPost>): Promise<DiscussionPost | undefined> {
    const [updated] = await db.update(discussionPosts).set({ ...data, isEdited: true, updatedAt: new Date() }).where(eq(discussionPosts.id, id)).returning();
    return updated;
  }

  async deleteDiscussionPost(id: string): Promise<void> {
    const post = await this.getDiscussionPost(id);
    if (post) {
      const thread = await this.getDiscussionThread(post.threadId);
      if (thread) {
        await db.update(discussionThreads).set({ replyCount: Math.max(0, (thread.replyCount || 0) - 1) }).where(eq(discussionThreads.id, post.threadId));
      }
    }
    await db.delete(discussionPosts).where(eq(discussionPosts.id, id));
  }

  async getCertificate(id: string): Promise<Certificate | undefined> {
    const [certificate] = await db.select().from(certificates).where(eq(certificates.id, id));
    return certificate;
  }

  async getCertificatesByUser(userId: string): Promise<Certificate[]> {
    return db.select().from(certificates).where(eq(certificates.userId, userId));
  }

  async getCertificateByCourse(userId: string, courseId: string): Promise<Certificate | undefined> {
    const [certificate] = await db.select().from(certificates)
      .where(and(eq(certificates.userId, userId), eq(certificates.courseId, courseId)));
    return certificate;
  }

  async getCertificateByCohort(userId: string, cohortId: string): Promise<Certificate | undefined> {
    const [certificate] = await db.select().from(certificates)
      .where(and(eq(certificates.userId, userId), eq(certificates.cohortId, cohortId)));
    return certificate;
  }

  async getAllCertificates(): Promise<Certificate[]> {
    return db.select().from(certificates).orderBy(desc(certificates.requestedAt));
  }

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const [newCertificate] = await db.insert(certificates).values(certificate).returning();
    return newCertificate;
  }

  async updateCertificate(id: string, data: Partial<InsertCertificate>): Promise<Certificate | undefined> {
    const [updated] = await db.update(certificates).set(data).where(eq(certificates.id, id)).returning();
    return updated;
  }

  async getAllAchievements(): Promise<Achievement[]> {
    return db.select().from(achievements);
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const userAchievementsList = await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
    const achievementsList = [];
    for (const ua of userAchievementsList) {
      const [achievement] = await db.select().from(achievements).where(eq(achievements.id, ua.achievementId));
      if (achievement) achievementsList.push(achievement);
    }
    return achievementsList;
  }

  async awardAchievement(userId: string, achievementId: string): Promise<void> {
    await db.insert(userAchievements).values({ userId, achievementId });
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async getApplication(id: string): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application;
  }

  async getApplicationDraftByEmail(email: string): Promise<Application | undefined> {
    const normalized = email.toLowerCase().trim();
    const [application] = await db.select().from(applications)
      .where(and(sql`lower(${applications.email}) = ${normalized}`, eq(applications.status, "draft")))
      .orderBy(desc(applications.updatedAt))
      .limit(1);
    return application;
  }

  async getSubmittedApplicationByEmail(email: string): Promise<Application | undefined> {
    const normalized = email.toLowerCase().trim();
    const [application] = await db.select().from(applications)
      .where(and(sql`lower(${applications.email}) = ${normalized}`, ne(applications.status, "draft")))
      .limit(1);
    return application;
  }

  async getMostRecentApplicationByEmail(email: string): Promise<Application | undefined> {
    const normalized = email.toLowerCase().trim();
    const [application] = await db.select().from(applications)
      .where(sql`lower(${applications.email}) = ${normalized}`)
      .orderBy(desc(applications.updatedAt))
      .limit(1);
    return application;
  }

  async getAllApplications(): Promise<Application[]> {
    return db.select().from(applications).orderBy(desc(applications.submittedAt));
  }

  async getApplicationsByStatus(status: string): Promise<Application[]> {
    return db.select().from(applications).where(eq(applications.status, status as any)).orderBy(desc(applications.submittedAt));
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const [newApplication] = await db.insert(applications).values(application).returning();
    return newApplication;
  }

  async updateApplication(id: string, data: Partial<InsertApplication>): Promise<Application | undefined> {
    const [updated] = await db.update(applications).set(data).where(eq(applications.id, id)).returning();
    return updated;
  }

  async deleteApplication(id: string): Promise<void> {
    await db.delete(applications).where(eq(applications.id, id));
  }

  async getApplicationEvaluation(applicationId: string): Promise<ApplicationEvaluation | undefined> {
    const [evaluation] = await db.select().from(applicationEvaluations).where(eq(applicationEvaluations.applicationId, applicationId));
    return evaluation;
  }

  async upsertApplicationEvaluation(data: InsertApplicationEvaluation): Promise<ApplicationEvaluation> {
    const [result] = await db
      .insert(applicationEvaluations)
      .values(data)
      .onConflictDoUpdate({
        target: applicationEvaluations.applicationId,
        set: {
          overallScore: data.overallScore,
          leadershipScore: data.leadershipScore,
          businessViabilityScore: data.businessViabilityScore,
          marketScaleScore: data.marketScaleScore,
          energyInfraImpactScore: data.energyInfraImpactScore,
          programReadinessScore: data.programReadinessScore,
          summary: data.summary,
          strengths: data.strengths,
          concerns: data.concerns,
          recommendation: data.recommendation,
          evaluatedAt: new Date(),
          evaluatedByModel: data.evaluatedByModel,
        },
      })
      .returning();
    return result;
  }

  async getAllApplicationEvaluations(): Promise<ApplicationEvaluation[]> {
    return db.select().from(applicationEvaluations);
  }

  async getCohortParticipant(id: string): Promise<CohortParticipant | undefined> {
    const [participant] = await db.select().from(cohortParticipants).where(eq(cohortParticipants.id, id));
    return participant;
  }

  async getCohortParticipantByUserAndCohort(userId: string, cohortId: string): Promise<CohortParticipant | undefined> {
    const [participant] = await db.select().from(cohortParticipants).where(and(
      eq(cohortParticipants.userId, userId),
      eq(cohortParticipants.cohortId, cohortId),
    ));
    return participant;
  }

  async getCohortParticipantsByCohort(cohortId: string): Promise<CohortParticipant[]> {
    return db.select().from(cohortParticipants)
      .where(eq(cohortParticipants.cohortId, cohortId))
      .orderBy(asc(cohortParticipants.acceptedAt));
  }

  async getCohortParticipantsByUser(userId: string): Promise<CohortParticipant[]> {
    return db.select().from(cohortParticipants)
      .where(eq(cohortParticipants.userId, userId))
      .orderBy(desc(cohortParticipants.acceptedAt));
  }

  async createCohortParticipant(data: InsertCohortParticipant): Promise<CohortParticipant> {
    const [participant] = await db.insert(cohortParticipants).values(data).returning();
    return participant;
  }

  async updateCohortParticipant(id: string, data: Partial<InsertCohortParticipant>): Promise<CohortParticipant | undefined> {
    const [participant] = await db.update(cohortParticipants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(cohortParticipants.id, id))
      .returning();
    return participant;
  }

  async ensureCohortParticipantFromApplication(application: Application, userId: string): Promise<CohortParticipant | undefined> {
    if (!application.cohortId) return undefined;
    const existing = await this.getCohortParticipantByUserAndCohort(userId, application.cohortId);
    if (existing) {
      return (await this.updateCohortParticipant(existing.id, {
        applicationId: application.id,
        status: "active",
      })) ?? existing;
    }
    return this.createCohortParticipant({
      userId,
      cohortId: application.cohortId,
      applicationId: application.id,
      projectName: application.companyName || application.companyLegalName || null,
      projectDescription: application.projectDescription || application.businessDescription || null,
      projectStage: application.projectStage || application.projectCurrentStatus || null,
      status: "active",
      acceptedAt: new Date(),
    });
  }

  async getProgressMilestones(participantId: string): Promise<ProgressMilestone[]> {
    return db.select().from(progressMilestones)
      .where(eq(progressMilestones.participantId, participantId))
      .orderBy(asc(progressMilestones.targetAt), desc(progressMilestones.createdAt));
  }

  async getProgressMilestone(id: string): Promise<ProgressMilestone | undefined> {
    const [milestone] = await db.select().from(progressMilestones).where(eq(progressMilestones.id, id));
    return milestone;
  }

  async createProgressMilestone(data: InsertProgressMilestone): Promise<ProgressMilestone> {
    const [milestone] = await db.insert(progressMilestones).values(data).returning();
    return milestone;
  }

  async updateProgressMilestone(id: string, data: Partial<InsertProgressMilestone>): Promise<ProgressMilestone | undefined> {
    const [milestone] = await db.update(progressMilestones)
      .set({
        ...data,
        updatedAt: new Date(),
        completedAt: data.status === "completed" ? (data.completedAt ?? new Date()) : data.completedAt,
      })
      .where(eq(progressMilestones.id, id))
      .returning();
    return milestone;
  }

  async getProgressReviews(participantId: string): Promise<ProgressReview[]> {
    return db.select().from(progressReviews)
      .where(eq(progressReviews.participantId, participantId))
      .orderBy(asc(progressReviews.createdAt));
  }

  async getProgressReview(participantId: string, reviewType: string): Promise<ProgressReview | undefined> {
    const [review] = await db.select().from(progressReviews).where(and(
      eq(progressReviews.participantId, participantId),
      eq(progressReviews.reviewType, reviewType as "baseline" | "midpoint" | "final"),
    ));
    return review;
  }

  async upsertProgressReview(data: InsertProgressReview): Promise<ProgressReview> {
    const existing = await this.getProgressReview(data.participantId, data.reviewType);
    if (existing) {
      const [review] = await db.update(progressReviews)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(progressReviews.id, existing.id))
        .returning();
      return review;
    }
    const [review] = await db.insert(progressReviews).values(data).returning();
    return review;
  }

  async getProgressFeedback(participantId: string, includeInternal = false): Promise<ProgressFeedback[]> {
    const conditions = [eq(progressFeedback.participantId, participantId)];
    if (!includeInternal) conditions.push(eq(progressFeedback.visibility, "participant"));
    return db.select().from(progressFeedback)
      .where(and(...conditions))
      .orderBy(desc(progressFeedback.createdAt));
  }

  async createProgressFeedback(data: InsertProgressFeedback): Promise<ProgressFeedback> {
    const [feedback] = await db.insert(progressFeedback).values(data).returning();
    return feedback;
  }

  async getCohort(id: string): Promise<Cohort | undefined> {
    const [cohort] = await db.select().from(cohorts).where(eq(cohorts.id, id));
    return cohort;
  }

  async getCohortBySlug(slug: string): Promise<Cohort | undefined> {
    const [cohort] = await db.select().from(cohorts).where(eq(cohorts.slug, slug));
    return cohort;
  }

  async getOpenCohort(): Promise<Cohort | undefined> {
    const [cohort] = await db.select().from(cohorts).where(eq(cohorts.isOpen, true));
    return cohort;
  }

  async getOpenCohorts(): Promise<Cohort[]> {
    return db.select().from(cohorts).where(eq(cohorts.isOpen, true)).orderBy(desc(cohorts.createdAt));
  }

  async getAllCohorts(): Promise<Cohort[]> {
    return db.select().from(cohorts).orderBy(desc(cohorts.createdAt));
  }

  // Public-facing cohorts: hide drafts (not yet announced), open cohorts first.
  async getPublicCohorts(): Promise<Cohort[]> {
    const list = await db.select().from(cohorts).where(ne(cohorts.status, "draft")).orderBy(desc(cohorts.createdAt));
    const statusPriority: Record<string, number> = { open: 0, closed: 1, archived: 2 };
    return list.sort((a, b) => (statusPriority[a.status] ?? 9) - (statusPriority[b.status] ?? 9));
  }

  // The "primary" cohort is the default cohort bare /apply maps to: the core
  // cohort (as opposed to a sponsored one like DOREWA), preferring whichever
  // core cohort is currently open, else the most recently created one.
  async getPrimaryCohort(): Promise<Cohort | undefined> {
    const coreCohorts = await db.select().from(cohorts).where(eq(cohorts.cohortType, "core")).orderBy(desc(cohorts.createdAt));
    if (coreCohorts.length === 0) return undefined;
    return coreCohorts.find((c) => c.status === "open") ?? coreCohorts[0];
  }

  async createCohort(data: InsertCohort): Promise<Cohort> {
    // Keep isActive/isOpen booleans in sync with the richer `status` field
    const status = data.status ?? "draft";
    const [cohort] = await db.insert(cohorts).values({
      ...data,
      id: randomUUID(),
      status,
      isOpen: status === "open",
      isActive: status !== "archived",
    }).returning();
    return cohort;
  }

  async updateCohort(id: string, data: Partial<InsertCohort>): Promise<Cohort | undefined> {
    const patch: Partial<InsertCohort> = { ...data };
    // Whenever status changes, derive the legacy boolean flags from it so every
    // existing isOpen/isActive read (analytics, reports, applicant assignment) stays correct.
    if (patch.status) {
      patch.isOpen = patch.status === "open";
      patch.isActive = patch.status !== "archived";
    }
    const [cohort] = await db.update(cohorts).set(patch).where(eq(cohorts.id, id)).returning();
    return cohort;
  }

  async duplicateCohort(id: string, overrides: Partial<InsertCohort>): Promise<Cohort | undefined> {
    const source = await this.getCohort(id);
    if (!source) return undefined;
    const { id: _id, createdAt: _createdAt, ...rest } = source;
    const [cohort] = await db.insert(cohorts).values({
      ...rest,
      ...overrides,
      id: randomUUID(),
      status: "draft",
      isOpen: false,
      isActive: true,
    }).returning();
    return cohort;
  }

  async setOpenCohort(id: string, open: boolean): Promise<Cohort | undefined> {
    // Cohorts open/close independently — multiple cohorts (e.g. Core and Dorewa)
    // can accept applications at the same time.
    const [cohort] = await db.update(cohorts)
      .set({ isOpen: open, status: open ? "open" : "closed" })
      .where(eq(cohorts.id, id))
      .returning();
    return cohort;
  }

  async deleteCohort(id: string): Promise<void> {
    // Unassign applications first — the FK has no ON DELETE action, and the
    // admin UI promises assigned applications become unassigned, not that
    // deletion is blocked or cascades.
    await db.transaction(async (tx) => {
      await tx.update(applications).set({ cohortId: null }).where(eq(applications.cohortId, id));
      await tx.delete(cohorts).where(eq(cohorts.id, id));
    });
  }

  async assignApplicationToCohort(applicationId: string, cohortId: string | null): Promise<void> {
    await db.update(applications).set({ cohortId }).where(eq(applications.id, applicationId));
  }

  async getAllLearningPods(): Promise<LearningPod[]> {
    return db.select().from(learningPods).orderBy(desc(learningPods.createdAt));
  }

  async getLearningPodsByCohort(cohortId: string): Promise<LearningPod[]> {
    return db.select().from(learningPods)
      .where(and(eq(learningPods.cohortId, cohortId), eq(learningPods.status, "active")))
      .orderBy(asc(learningPods.name));
  }

  async getLearningPodsByUser(userId: string): Promise<LearningPod[]> {
    const memberPods = await db.select({ pod: learningPods })
      .from(learningPodMembers)
      .innerJoin(learningPods, eq(learningPodMembers.podId, learningPods.id))
      .where(and(eq(learningPodMembers.userId, userId), isNull(learningPodMembers.removedAt), eq(learningPods.status, "active")));
    const mentorPods = await db.select({ pod: learningPods })
      .from(learningPods)
      .where(and(eq(learningPods.mentorId, userId), eq(learningPods.status, "active")));
    const byId = new Map([...memberPods, ...mentorPods].map(({ pod }) => [pod.id, pod]));
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getLearningPod(id: string): Promise<LearningPod | undefined> {
    const [pod] = await db.select().from(learningPods).where(eq(learningPods.id, id));
    return pod;
  }

  async createLearningPod(data: InsertLearningPod): Promise<LearningPod> {
    const [pod] = await db.insert(learningPods).values(data).returning();
    return pod;
  }

  async createLearningPodWithMembers(data: InsertLearningPod, userIds: string[]): Promise<LearningPod> {
    const uniqueUserIds = Array.from(new Set(userIds));
    return db.transaction(async (tx) => {
      await tx.select({ id: cohorts.id })
        .from(cohorts)
        .where(eq(cohorts.id, data.cohortId))
        .for("update");

      if ((data.status ?? "active") === "active" && uniqueUserIds.length > 0) {
        const [conflict] = await tx.select({ userId: learningPodMembers.userId })
          .from(learningPodMembers)
          .innerJoin(learningPods, eq(learningPodMembers.podId, learningPods.id))
          .where(and(
            eq(learningPods.cohortId, data.cohortId),
            eq(learningPods.status, "active"),
            isNull(learningPodMembers.removedAt),
            inArray(learningPodMembers.userId, uniqueUserIds),
          ))
          .limit(1);
        if (conflict) throw new LearningPodMembershipConflictError();
      }

      const [pod] = await tx.insert(learningPods).values(data).returning();
      if (uniqueUserIds.length > 0) {
        await tx.insert(learningPodMembers).values(
          uniqueUserIds.map((userId) => ({ podId: pod.id, userId })),
        );
      }
      return pod;
    });
  }

  async createLearningPodsWithMembers(
    podInputs: Array<{ data: InsertLearningPod; userIds: string[] }>,
  ): Promise<LearningPod[]> {
    if (podInputs.length === 0) return [];

    const cohortId = podInputs[0].data.cohortId;
    if (podInputs.some(({ data }) => data.cohortId !== cohortId)) {
      throw new Error("All learning pods in a distribution must belong to the same cohort");
    }

    return db.transaction(async (tx) => {
      let cohortRows;
      try {
        cohortRows = await tx.select({ id: cohorts.id })
          .from(cohorts)
          .where(eq(cohorts.id, cohortId))
          .for("update", { noWait: true });
      } catch (error) {
        if (hasPostgresErrorCode(error, "55P03")) {
          throw new LearningPodDistributionInProgressError();
        }
        throw error;
      }
      if (cohortRows.length === 0) throw new Error("Cohort not found");

      const activeUserIds = Array.from(new Set(
        podInputs
          .filter(({ data }) => (data.status ?? "active") === "active")
          .flatMap(({ userIds }) => userIds),
      ));
      if (activeUserIds.length > 0) {
        const [conflict] = await tx.select({ userId: learningPodMembers.userId })
          .from(learningPodMembers)
          .innerJoin(learningPods, eq(learningPodMembers.podId, learningPods.id))
          .where(and(
            eq(learningPods.cohortId, cohortId),
            eq(learningPods.status, "active"),
            isNull(learningPodMembers.removedAt),
            inArray(learningPodMembers.userId, activeUserIds),
          ))
          .limit(1);
        if (conflict) throw new LearningPodMembershipConflictError();
      }

      const created: LearningPod[] = [];
      for (const { data, userIds } of podInputs) {
        const [pod] = await tx.insert(learningPods).values(data).returning();
        const uniqueUserIds = Array.from(new Set(userIds));
        if (uniqueUserIds.length > 0) {
          await tx.insert(learningPodMembers).values(
            uniqueUserIds.map((userId) => ({ podId: pod.id, userId })),
          );
        }
        created.push(pod);
      }
      return created;
    });
  }

  async updateLearningPod(id: string, data: Partial<InsertLearningPod>): Promise<LearningPod | undefined> {
    return db.transaction(async (tx) => {
      const [existing] = await tx.select()
        .from(learningPods)
        .where(eq(learningPods.id, id))
        .for("update");
      if (!existing) return undefined;

      const nextCohortId = data.cohortId ?? existing.cohortId;
      const nextStatus = data.status ?? existing.status;
      const cohortIds = Array.from(new Set([existing.cohortId, nextCohortId])).sort();
      for (const cohortId of cohortIds) {
        await tx.select({ id: cohorts.id })
          .from(cohorts)
          .where(eq(cohorts.id, cohortId))
          .for("update");
      }

      if (nextStatus === "active") {
        const members = await tx.select({ userId: learningPodMembers.userId })
          .from(learningPodMembers)
          .where(and(
            eq(learningPodMembers.podId, id),
            isNull(learningPodMembers.removedAt),
          ));
        const memberIds = members.map(({ userId }) => userId);
        if (memberIds.length > 0) {
          const [conflict] = await tx.select({ userId: learningPodMembers.userId })
            .from(learningPodMembers)
            .innerJoin(learningPods, eq(learningPodMembers.podId, learningPods.id))
            .where(and(
              eq(learningPods.cohortId, nextCohortId),
              eq(learningPods.status, "active"),
              ne(learningPods.id, id),
              isNull(learningPodMembers.removedAt),
              inArray(learningPodMembers.userId, memberIds),
            ))
            .limit(1);
          if (conflict) throw new LearningPodMembershipConflictError();
        }
      }

      const [pod] = await tx.update(learningPods)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(learningPods.id, id))
        .returning();
      return pod;
    });
  }

  async deleteLearningPod(id: string): Promise<void> {
    await db.delete(learningPods).where(eq(learningPods.id, id));
  }

  async getLearningPodMembers(podId: string): Promise<LearningPodMember[]> {
    return db.select().from(learningPodMembers)
      .where(and(eq(learningPodMembers.podId, podId), isNull(learningPodMembers.removedAt)))
      .orderBy(asc(learningPodMembers.joinedAt));
  }

  async setLearningPodMembers(podId: string, userIds: string[]): Promise<void> {
    const uniqueUserIds = Array.from(new Set(userIds));
    await db.transaction(async (tx) => {
      const [pod] = await tx.select()
        .from(learningPods)
        .where(eq(learningPods.id, podId))
        .for("update");
      if (!pod) return;

      await tx.select({ id: cohorts.id })
        .from(cohorts)
        .where(eq(cohorts.id, pod.cohortId))
        .for("update");

      if (pod.status === "active" && uniqueUserIds.length > 0) {
        const [conflict] = await tx.select({ userId: learningPodMembers.userId })
          .from(learningPodMembers)
          .innerJoin(learningPods, eq(learningPodMembers.podId, learningPods.id))
          .where(and(
            eq(learningPods.cohortId, pod.cohortId),
            eq(learningPods.status, "active"),
            ne(learningPods.id, podId),
            isNull(learningPodMembers.removedAt),
            inArray(learningPodMembers.userId, uniqueUserIds),
          ))
          .limit(1);
        if (conflict) throw new LearningPodMembershipConflictError();
      }

      await tx.delete(learningPodMembers).where(eq(learningPodMembers.podId, podId));
      if (uniqueUserIds.length > 0) {
        await tx.insert(learningPodMembers).values(
          uniqueUserIds.map((userId) => ({ podId, userId })),
        );
      }
    });
  }

  async getLearningPodAssignments(podId: string): Promise<LearningPodAssignment[]> {
    return db.select().from(learningPodAssignments)
      .where(eq(learningPodAssignments.podId, podId))
      .orderBy(asc(learningPodAssignments.dueAt), asc(learningPodAssignments.createdAt));
  }

  async getLearningPodAssignment(id: string): Promise<LearningPodAssignment | undefined> {
    const [assignment] = await db.select().from(learningPodAssignments)
      .where(eq(learningPodAssignments.id, id));
    return assignment;
  }

  async createLearningPodAssignment(data: InsertLearningPodAssignment): Promise<LearningPodAssignment> {
    const [assignment] = await db.insert(learningPodAssignments).values(data).returning();
    return assignment;
  }

  async updateLearningPodAssignment(id: string, data: Partial<InsertLearningPodAssignment>): Promise<LearningPodAssignment | undefined> {
    const [assignment] = await db.update(learningPodAssignments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(learningPodAssignments.id, id))
      .returning();
    return assignment;
  }

  async deleteLearningPodAssignment(id: string): Promise<void> {
    await db.delete(learningPodAssignments).where(eq(learningPodAssignments.id, id));
  }

  async getLearningPodSubmissions(assignmentId: string, podId: string): Promise<LearningPodSubmission[]> {
    return db.select().from(learningPodSubmissions)
      .where(and(
        eq(learningPodSubmissions.assignmentId, assignmentId),
        eq(learningPodSubmissions.podId, podId),
      ))
      .orderBy(desc(learningPodSubmissions.updatedAt));
  }

  async getLearningPodSubmissionById(id: string): Promise<LearningPodSubmission | undefined> {
    const [submission] = await db.select().from(learningPodSubmissions)
      .where(eq(learningPodSubmissions.id, id));
    return submission;
  }

  async getLearningPodSubmission(assignmentId: string, podId: string, submitterId?: string): Promise<LearningPodSubmission | undefined> {
    const conditions = [
      eq(learningPodSubmissions.assignmentId, assignmentId),
      eq(learningPodSubmissions.podId, podId),
    ];
    if (submitterId) conditions.push(eq(learningPodSubmissions.submitterId, submitterId));
    const [submission] = await db.select().from(learningPodSubmissions)
      .where(and(...conditions))
      .orderBy(desc(learningPodSubmissions.updatedAt))
      .limit(1);
    return submission;
  }

  async createLearningPodSubmission(data: InsertLearningPodSubmission): Promise<LearningPodSubmission> {
    const [submission] = await db.insert(learningPodSubmissions).values(data).returning();
    return submission;
  }

  async updateLearningPodSubmission(id: string, data: Partial<LearningPodSubmission>): Promise<LearningPodSubmission | undefined> {
    const [submission] = await db.update(learningPodSubmissions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(learningPodSubmissions.id, id))
      .returning();
    return submission;
  }

  async getNewsletterSubscriber(id: string): Promise<NewsletterSubscriber | undefined> {
    const [subscriber] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.id, id));
    return subscriber;
  }

  async getNewsletterSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined> {
    const [subscriber] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email));
    return subscriber;
  }

  async getAllNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    return db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.subscribedAt));
  }

  async getActiveNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    return db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.isActive, true)).orderBy(desc(newsletterSubscribers.subscribedAt));
  }

  async createNewsletterSubscriber(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    const [newSubscriber] = await db.insert(newsletterSubscribers).values(subscriber).returning();
    return newSubscriber;
  }

  async updateNewsletterSubscriber(id: string, data: Partial<InsertNewsletterSubscriber>): Promise<NewsletterSubscriber | undefined> {
    const [updated] = await db.update(newsletterSubscribers).set(data).where(eq(newsletterSubscribers.id, id)).returning();
    return updated;
  }

  async unsubscribeNewsletter(email: string): Promise<void> {
    await db.update(newsletterSubscribers).set({ isActive: false, unsubscribedAt: new Date() }).where(eq(newsletterSubscribers.email, email));
  }

  async getNewsletterCampaign(id: string): Promise<NewsletterCampaign | undefined> {
    const [campaign] = await db.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id, id));
    return campaign;
  }

  async getAllNewsletterCampaigns(): Promise<NewsletterCampaign[]> {
    return db.select().from(newsletterCampaigns).orderBy(desc(newsletterCampaigns.createdAt));
  }

  async createNewsletterCampaign(campaign: InsertNewsletterCampaign): Promise<NewsletterCampaign> {
    const [newCampaign] = await db.insert(newsletterCampaigns).values(campaign).returning();
    return newCampaign;
  }

  async updateNewsletterCampaign(id: string, data: Partial<InsertNewsletterCampaign>): Promise<NewsletterCampaign | undefined> {
    const [updated] = await db.update(newsletterCampaigns).set(data).where(eq(newsletterCampaigns.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
