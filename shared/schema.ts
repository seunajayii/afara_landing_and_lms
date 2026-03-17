import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["participant", "mentor", "facilitator", "admin", "superadmin", "community_member"]);
export const lessonTypeEnum = pgEnum("lesson_type", ["video", "text", "quiz", "downloadable"]);
export const videoSourceEnum = pgEnum("video_source", ["youtube", "vimeo", "upload"]);
export const progressStatusEnum = pgEnum("progress_status", ["not_started", "in_progress", "completed"]);
export const sessionStatusEnum = pgEnum("session_status", ["scheduled", "completed", "cancelled"]);
export const eventTypeEnum = pgEnum("event_type", ["webinar", "workshop", "live_session", "networking"]);
export const resourceTypeEnum = pgEnum("resource_type", ["document", "template", "toolkit", "guide"]);
export const contentStatusEnum = pgEnum("content_status", ["draft", "pending_review", "published", "archived"]);
export const visibilityEnum = pgEnum("content_visibility", ["public", "community", "cohort_only"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: userRoleEnum("role").notNull().default("participant"),
  profileImageUrl: text("profile_image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  bio: text("bio"),
  company: text("company"),
  jobTitle: text("job_title"),
  country: text("country"),
  linkedinUrl: text("linkedin_url"),
  websiteUrl: text("website_url"),
  expertiseAreas: text("expertise_areas").array(),
  industries: text("industries").array(),
  yearsExperience: integer("years_experience"),
  meetingPlatformPreference: text("meeting_platform_preference"),
  meetingLink: text("meeting_link"),
});

export const mentorProfiles = pgTable("mentor_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  specializations: text("specializations").array(),
  maxMentees: integer("max_mentees").default(5),
  currentMentees: integer("current_mentees").default(0),
  availabilityDescription: text("availability_description"),
  sessionDurationMinutes: integer("session_duration_minutes").default(60),
  isAcceptingMentees: boolean("is_accepting_mentees").default(true),
});

export const facilitatorProfiles = pgTable("facilitator_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  teachingAreas: text("teaching_areas").array(),
  coursesDelivered: integer("courses_delivered").default(0),
  totalStudents: integer("total_students").default(0),
  rating: integer("rating"),
});

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  thumbnailUrl: text("thumbnail_url"),
  instructorId: varchar("instructor_id").references(() => users.id),
  durationMinutes: integer("duration_minutes"),
  status: contentStatusEnum("status").notNull().default("draft"),
  category: text("category"),
  level: text("level"),
  prerequisites: text("prerequisites").array(),
  learningOutcomes: text("learning_outcomes").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  publishedAt: timestamp("published_at"),
});

export const modules = pgTable("modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
  durationMinutes: integer("duration_minutes"),
});

export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").notNull().references(() => modules.id),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
  lessonType: lessonTypeEnum("lesson_type").notNull().default("video"),
  content: text("content"),
  videoSource: videoSourceEnum("video_source"),
  videoUrl: text("video_url"),
  videoId: text("video_id"),
  videoDurationSeconds: integer("video_duration_seconds"),
  downloadableUrl: text("downloadable_url"),
  durationMinutes: integer("duration_minutes"),
  isFree: boolean("is_free").default(false),
});

export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  progressPercent: integer("progress_percent").default(0),
  status: progressStatusEnum("status").notNull().default("not_started"),
});

export const lessonProgress = pgTable("lesson_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  lessonId: varchar("lesson_id").notNull().references(() => lessons.id),
  status: progressStatusEnum("status").notNull().default("not_started"),
  videoWatchedSeconds: integer("video_watched_seconds").default(0),
  completedAt: timestamp("completed_at"),
  lastAccessedAt: timestamp("last_accessed_at"),
});

export const mentorshipRequests = pgTable("mentorship_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  menteeId: varchar("mentee_id").notNull().references(() => users.id),
  mentorId: varchar("mentor_id").notNull().references(() => users.id),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
});

export const mentorshipSessions = pgTable("mentorship_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mentorId: varchar("mentor_id").notNull().references(() => users.id),
  menteeId: varchar("mentee_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  durationMinutes: integer("duration_minutes").default(60),
  meetingPlatform: text("meeting_platform"),
  meetingLink: text("meeting_link"),
  status: sessionStatusEnum("status").notNull().default("scheduled"),
  notes: text("notes"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  eventType: eventTypeEnum("event_type").notNull(),
  hostId: varchar("host_id").references(() => users.id),
  thumbnailUrl: text("thumbnail_url"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  durationMinutes: integer("duration_minutes"),
  meetingPlatform: text("meeting_platform"),
  meetingLink: text("meeting_link"),
  recordingUrl: text("recording_url"),
  maxAttendees: integer("max_attendees"),
  isPublic: boolean("is_public").default(true),
  visibility: visibilityEnum("visibility").notNull().default("community"),
  status: contentStatusEnum("status").notNull().default("published"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const eventRegistrations = pgTable("event_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  registeredAt: timestamp("registered_at").notNull().defaultNow(),
  attended: boolean("attended").default(false),
});

export const resources = pgTable("resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  resourceType: resourceTypeEnum("resource_type").notNull(),
  category: text("category"),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  thumbnailUrl: text("thumbnail_url"),
  downloadCount: integer("download_count").default(0),
  uploadedById: varchar("uploaded_by_id").references(() => users.id),
  visibility: visibilityEnum("visibility").notNull().default("community"),
  status: contentStatusEnum("status").notNull().default("published"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const discussionThreads = pgTable("discussion_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content"),
  authorId: varchar("author_id").notNull().references(() => users.id),
  category: text("category"),
  isPinned: boolean("is_pinned").default(false),
  isLocked: boolean("is_locked").default(false),
  viewCount: integer("view_count").default(0),
  replyCount: integer("reply_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const discussionPosts = pgTable("discussion_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull().references(() => discussionThreads.id),
  authorId: varchar("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  parentPostId: varchar("parent_post_id"),
  likeCount: integer("like_count").default(0),
  isEdited: boolean("is_edited").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const postLikes = pgTable("post_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => discussionPosts.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const certificateStatusEnum = pgEnum("certificate_status", ["pending", "approved", "rejected"]);
export const applicationStatusEnum = pgEnum("application_status", ["draft", "submitted", "under_review", "accepted", "rejected", "waitlisted"]);

export const certificates = pgTable("certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  certificateNumber: text("certificate_number").notNull().unique(),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  certificateUrl: text("certificate_url"),
  approvalStatus: certificateStatusEnum("approval_status").notNull().default("pending"),
  approvedById: varchar("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
});

export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  badgeImageUrl: text("badge_image_url"),
  criteria: text("criteria"),
});

export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  achievementId: varchar("achievement_id").notNull().references(() => achievements.id),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message"),
  type: text("type"),
  isRead: boolean("is_read").default(false),
  linkUrl: text("link_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  isActive: boolean("is_active").notNull().default(true),
  subscribedAt: timestamp("subscribed_at").notNull().defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  source: text("source").default("website"),
});

export const newsletterCampaigns = pgTable("newsletter_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  sentById: varchar("sent_by_id").references(() => users.id),
  sentAt: timestamp("sent_at"),
  recipientCount: integer("recipient_count").default(0),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Personal Section
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  personalStatement: text("personal_statement"),
  videoEssayUrl: text("video_essay_url"),
  
  // Section 1: Applicant Background & Sector Experience
  professionalBackground: text("professional_background"),
  yearsOfExperience: integer("years_of_experience"),
  keyResponsibilities: text("key_responsibilities"),
  hasProjectExperience: boolean("has_project_experience"),
  projectExperience: text("project_experience"),
  primarySector: text("primary_sector"),
  sectorSpecification: text("sector_specification"),
  subSectors: text("sub_sectors").array(),
  otherSubSector: text("other_sub_sector"),
  
  // Section 2: Business Ownership & Operations
  companyLegalName: text("company_legal_name"),
  companyCountry: text("company_country"),
  companyHeadquarters: text("company_headquarters"),
  incorporationYear: integer("incorporation_year"),
  ownershipPercentage: integer("ownership_percentage"),
  numberOfShareholders: integer("number_of_shareholders"),
  shareholdersOver25Percent: boolean("shareholders_over_25_percent"),
  
  // Section 3: Financial Documentation & Compliance
  canProvideFinancials: boolean("can_provide_financials"),
  isTaxRegistered: boolean("is_tax_registered"),
  
  // Section 4: Project Readiness & Development Status
  projectDescription: text("project_description"),
  projectLocation: text("project_location"),
  projectSector: text("project_sector"),
  projectCurrentStatus: text("project_current_status"),
  projectStage: text("project_stage"),
  projectDocuments: text("project_documents").array(),
  otherProjectDocuments: text("other_project_documents"),
  projectedImpact: text("projected_impact"),
  
  // Section 5: Support Needs & Project Advancement
  mainChallenges: text("main_challenges"),
  supportAreasNeeded: text("support_areas_needed").array(),
  otherSupportArea: text("other_support_area"),
  keyActivitiesForNextStage: text("key_activities_for_next_stage"),
  fundingRequired: text("funding_required"),
  expectedTimeline: text("expected_timeline"),
  
  // Section 6: Founder Commitment & Peer Support
  canCommitToProgram: boolean("can_commit_to_program"),
  canAttendLagosEvent: boolean("can_attend_lagos_event"),
  commitmentManagementPlan: text("commitment_management_plan"),
  willingToMentor: boolean("willing_to_mentor"),
  peerMentorshipImportance: text("peer_mentorship_importance"),
  
  // Final Question
  whyAfaraIsRight: text("why_afara_is_right"),
  
  // Legacy fields for backwards compatibility
  linkedinUrl: text("linkedin_url"),
  additionalInfo: text("additional_info"),
  
  // Application tracking
  currentStep: integer("current_step").default(0),
  status: applicationStatusEnum("status").notNull().default("draft"),
  reviewNotes: text("review_notes"),
  reviewedById: varchar("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  submittedAt: timestamp("submitted_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true });
export const insertMentorProfileSchema = createInsertSchema(mentorProfiles).omit({ id: true });
export const insertFacilitatorProfileSchema = createInsertSchema(facilitatorProfiles).omit({ id: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true });
export const insertModuleSchema = createInsertSchema(modules).omit({ id: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrolledAt: true });
export const insertLessonProgressSchema = createInsertSchema(lessonProgress).omit({ id: true });
export const insertMentorshipRequestSchema = createInsertSchema(mentorshipRequests).omit({ id: true, requestedAt: true });
export const insertMentorshipSessionSchema = createInsertSchema(mentorshipSessions).omit({ id: true, createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations).omit({ id: true, registeredAt: true });
export const insertResourceSchema = createInsertSchema(resources).omit({ id: true, createdAt: true });
export const insertDiscussionThreadSchema = createInsertSchema(discussionThreads).omit({ id: true, createdAt: true });
export const insertDiscussionPostSchema = createInsertSchema(discussionPosts).omit({ id: true, createdAt: true });
export const insertCertificateSchema = createInsertSchema(certificates).omit({ id: true, issuedAt: true });
export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({ id: true, subscribedAt: true });
export const insertNewsletterCampaignSchema = createInsertSchema(newsletterCampaigns).omit({ id: true, createdAt: true, sentAt: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ 
  id: true, 
  reviewedAt: true, 
  reviewedById: true,
  reviewNotes: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertMentorProfile = z.infer<typeof insertMentorProfileSchema>;
export type MentorProfile = typeof mentorProfiles.$inferSelect;
export type InsertFacilitatorProfile = z.infer<typeof insertFacilitatorProfileSchema>;
export type FacilitatorProfile = typeof facilitatorProfiles.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type Module = typeof modules.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertLessonProgress = z.infer<typeof insertLessonProgressSchema>;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type InsertMentorshipRequest = z.infer<typeof insertMentorshipRequestSchema>;
export type MentorshipRequest = typeof mentorshipRequests.$inferSelect;
export type InsertMentorshipSession = z.infer<typeof insertMentorshipSessionSchema>;
export type MentorshipSession = typeof mentorshipSessions.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertDiscussionThread = z.infer<typeof insertDiscussionThreadSchema>;
export type DiscussionThread = typeof discussionThreads.$inferSelect;
export type InsertDiscussionPost = z.infer<typeof insertDiscussionPostSchema>;
export type DiscussionPost = typeof discussionPosts.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificates.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterCampaign = z.infer<typeof insertNewsletterCampaignSchema>;
export type NewsletterCampaign = typeof newsletterCampaigns.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;
