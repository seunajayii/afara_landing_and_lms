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
  type Resource, type InsertResource,
  type DiscussionThread, type InsertDiscussionThread,
  type DiscussionPost, type InsertDiscussionPost,
  type Certificate, type InsertCertificate,
  type Achievement, type InsertAchievement,
  type Notification, type InsertNotification,
  type NewsletterSubscriber, type InsertNewsletterSubscriber,
  type NewsletterCampaign, type InsertNewsletterCampaign,
  type Application, type InsertApplication,
  users, profiles, mentorProfiles, facilitatorProfiles,
  courses, modules, lessons, enrollments, lessonProgress,
  mentorshipRequests, mentorshipSessions,
  events, eventRegistrations, resources,
  discussionThreads, discussionPosts, postLikes,
  certificates, achievements, userAchievements, notifications,
  newsletterSubscribers, newsletterCampaigns,
  applications
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
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
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  
  getAllAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<Achievement[]>;
  awardAchievement(userId: string, achievementId: string): Promise<void>;
  
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  
  getApplication(id: string): Promise<Application | undefined>;
  getAllApplications(): Promise<Application[]>;
  getApplicationsByStatus(status: string): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: string, data: Partial<InsertApplication>): Promise<Application | undefined>;
  deleteApplication(id: string): Promise<void>;
  
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

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
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

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updated] = await db.update(courses).set(data).where(eq(courses.id, id)).returning();
    return updated;
  }

  async deleteCourse(id: string): Promise<void> {
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

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const [newCertificate] = await db.insert(certificates).values(certificate).returning();
    return newCertificate;
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
