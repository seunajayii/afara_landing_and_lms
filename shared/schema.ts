import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, pgEnum, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import type { NewsletterAudience, NewsletterBlock } from "./newsletter";

// Cohort-specific extra application questions (e.g. DOREWA-only questions),
// configured by admins per cohort and rendered as an extra step at the end
// of that cohort's application form. A cohort with none defined (the
// default) leaves the application form completely unchanged.
export const extraQuestionTypeEnum = ["short_text", "long_text", "single_select", "yes_no"] as const;
export const extraQuestionSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().trim().min(1, "Question label is required"),
    type: z.enum(extraQuestionTypeEnum),
    required: z.boolean().default(false),
    options: z.array(z.string().trim().min(1)).optional(),
  })
  .superRefine((q, ctx) => {
    if (q.type === "single_select" && (q.options ?? []).length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "A single-select question needs at least 2 options",
      });
    }
  });
export type ExtraQuestion = z.infer<typeof extraQuestionSchema>;
export const extraQuestionsListSchema = z.array(extraQuestionSchema).default([]);

// Applicant answers to a cohort's extra questions, keyed by question id.
export const extraAnswersSchema = z.record(z.union([z.string(), z.boolean()])).default({});
export type ExtraAnswers = z.infer<typeof extraAnswersSchema>;

export const userRoleEnum = pgEnum("user_role", ["participant", "mentor", "facilitator", "admin", "superadmin", "community_member"]);
export const lessonTypeEnum = pgEnum("lesson_type", ["video", "text", "quiz", "downloadable", "live_session"]);
export const videoSourceEnum = pgEnum("video_source", ["youtube", "vimeo", "upload"]);
export const progressStatusEnum = pgEnum("progress_status", ["not_started", "in_progress", "completed"]);
export const sessionStatusEnum = pgEnum("session_status", ["scheduled", "completed", "cancelled"]);
export const eventTypeEnum = pgEnum("event_type", ["webinar", "workshop", "live_session", "networking"]);
export const resourceTypeEnum = pgEnum("resource_type", ["document", "template", "toolkit", "guide", "resource_partner", "video"]);
export const contentStatusEnum = pgEnum("content_status", ["draft", "pending_review", "published", "archived"]);
export const visibilityEnum = pgEnum("content_visibility", ["public", "community", "cohort_only"]);
export const cohortTypeEnum = pgEnum("cohort_type", ["core", "sponsored"]);
export const cohortStatusEnum = pgEnum("cohort_status", ["draft", "open", "closed", "archived"]);
export const courseAudienceEnum = pgEnum("course_audience", ["all", "selected"]);
export const learningPodStatusEnum = pgEnum("learning_pod_status", ["active", "archived"]);
export const podWorkTypeEnum = pgEnum("pod_work_type", ["individual", "group"]);
export const participantProgressStatusEnum = pgEnum("participant_progress_status", ["active", "completed", "withdrawn"]);
export const progressReviewTypeEnum = pgEnum("progress_review_type", ["baseline", "midpoint", "final"]);
export const progressReviewStatusEnum = pgEnum("progress_review_status", ["draft", "published"]);
export const progressMilestoneStatusEnum = pgEnum("progress_milestone_status", ["planned", "in_progress", "completed", "blocked"]);
export const progressFeedbackSourceEnum = pgEnum("progress_feedback_source", ["mentor", "facilitator", "participant", "admin"]);
export const progressFeedbackVisibilityEnum = pgEnum("progress_feedback_visibility", ["participant", "internal"]);
export const assignmentTypeEnum = pgEnum("assignment_type", ["quiz", "submission", "reflection"]);
export const assignmentTargetTypeEnum = pgEnum("assignment_target_type", ["cohort", "pod", "course", "module"]);
export const assignmentQuestionTypeEnum = pgEnum("assignment_question_type", ["single_choice", "multiple_choice", "short_text", "long_text", "reflection"]);
export const assignmentSubmissionStatusEnum = pgEnum("assignment_submission_status", ["draft", "submitted", "graded", "returned"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: userRoleEnum("role").notNull().default("participant"),
  profileImageUrl: text("profile_image_url"),
  isActive: boolean("is_active").notNull().default(true),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpiresAt: timestamp("password_reset_expires_at"),
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
  // When absent, the API reports the sum of lesson durations. This is kept
  // separate from the calculated value so facilitators can intentionally set
  // a different advertised duration without losing the curriculum estimate.
  durationOverrideMinutes: integer("duration_override_minutes"),
  status: contentStatusEnum("status").notNull().default("draft"),
  // Existing courses default to all participants. Admins can switch this to
  // selected and assign the course through courseCohortAssignments.
  audience: courseAudienceEnum("audience").notNull().default("all"),
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
  // A lesson references a reusable resource instead of copying its file or
  // video provider data. Direct YouTube fields remain for existing lessons.
  resourceId: varchar("resource_id").references(() => resources.id),
  // Kept as an ID rather than a schema-level reference to avoid a circular
  // declaration: events can also point back to a recording lesson.
  eventId: varchar("event_id"),
  durationMinutes: integer("duration_minutes"),
  status: contentStatusEnum("status").notNull().default("draft"),
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
  // Pod events are private to one learning pod. This remains an ID here
  // because learningPods is declared later in the schema.
  podId: varchar("pod_id"),
  thumbnailUrl: text("thumbnail_url"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  durationMinutes: integer("duration_minutes"),
  meetingPlatform: text("meeting_platform"),
  meetingLink: text("meeting_link"),
  // A stable Zoom meeting identifier lets recording webhooks find the
  // corresponding AFÁRÁ event without relying on a mutable title or URL.
  zoomMeetingId: text("zoom_meeting_id"),
  recordingUrl: text("recording_url"),
  recordingResourceId: varchar("recording_resource_id").references(() => resources.id, { onDelete: "set null" }),
  recordingLessonId: varchar("recording_lesson_id").references(() => lessons.id, { onDelete: "set null" }),
  maxAttendees: integer("max_attendees"),
  isPublic: boolean("is_public").default(true),
  visibility: visibilityEnum("visibility").notNull().default("community"),
  status: contentStatusEnum("status").notNull().default("published"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const eventFacilitators = pgTable("event_facilitators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (table) => ({
  eventUserUnique: uniqueIndex("event_facilitators_event_user_unique").on(table.eventId, table.userId),
}));

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
  fileStorageKey: text("file_storage_key"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  thumbnailUrl: text("thumbnail_url"),
  downloadCount: integer("download_count").default(0),
  uploadedById: varchar("uploaded_by_id").references(() => users.id),
  visibility: visibilityEnum("visibility").notNull().default("community"),
  status: contentStatusEnum("status").notNull().default("published"),
  partnerName: text("partner_name"),
  partnerLinkType: text("partner_link_type").notNull().default("lms"),
  partnerResourceUrl: text("partner_resource_url"),
  partnerLoginUrl: text("partner_login_url"),
  partnerLoginUsername: text("partner_login_username"),
  partnerLoginPassword: text("partner_login_password"),
  youtubeVideoId: text("youtube_video_id"),
  youtubeUrl: text("youtube_url"),
  youtubeThumbnailUrl: text("youtube_thumbnail_url"),
  youtubeDurationSeconds: integer("youtube_duration_seconds"),
  youtubePrivacyStatus: text("youtube_privacy_status"),
  youtubeUploadStatus: text("youtube_upload_status"),
  // Private uploads are delivered through the application's signed playback
  // endpoint rather than exposing a provider URL to the learner.
  videoSource: videoSourceEnum("video_source"),
  videoStorageKey: text("video_storage_key"),
  videoContentType: text("video_content_type"),
  videoFileSize: integer("video_file_size"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Every private video is tracked as soon as it reaches object storage. The
// resourceId remains nullable while an administrator is still editing the
// resource, so abandoned uploads can be removed without scanning provider
// storage blindly.
export const privateVideoUploads = pgTable("private_video_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storageKey: text("storage_key").notNull().unique(),
  uploadedById: varchar("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
  resourceId: varchar("resource_id").references(() => resources.id, { onDelete: "set null" }),
  cleanupRequestedAt: timestamp("cleanup_requested_at"),
  // Keep cleanup history after the provider object is removed so admins can
  // distinguish pending, failed, and successfully completed cleanup work.
  cleanupStatus: text("cleanup_status").notNull().default("active"),
  cleanupAttemptCount: integer("cleanup_attempt_count").notNull().default(0),
  lastCleanupAttemptAt: timestamp("last_cleanup_attempt_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const zoomWebhookEvents = pgTable("zoom_webhook_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: text("event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull(),
  status: text("status").notNull().default("received"),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
  processingStartedAt: timestamp("processing_started_at"),
  processedAt: timestamp("processed_at"),
  error: text("error"),
});

export const zoomOAuthConnections = pgTable("zoom_oauth_connections", {
  id: varchar("id").primaryKey(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  accessTokenExpiresAt: timestamp("access_token_expires_at").notNull(),
  scope: text("scope"),
  zoomUserId: text("zoom_user_id"),
  zoomUserEmail: text("zoom_user_email"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const discussionThreads = pgTable("discussion_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content"),
  authorId: varchar("author_id").notNull().references(() => users.id),
  category: text("category"),
  attachmentJson: text("attachment_json"),
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
  attachmentJson: text("attachment_json"),
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
export const applicationStatusEnum = pgEnum("application_status", ["draft", "submitted", "under_review", "accepted", "rejected", "waitlisted", "disqualified"]);

export const certificates = pgTable("certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  courseId: varchar("course_id").references(() => courses.id),
  cohortId: varchar("cohort_id").references(() => cohorts.id, { onDelete: "cascade" }),
  certificateNumber: text("certificate_number").notNull().unique(),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
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
  contentJson: jsonb("content_json").$type<NewsletterBlock[]>(),
  audienceJson: jsonb("audience_json").$type<NewsletterAudience>(),
  sentById: varchar("sent_by_id").references(() => users.id),
  sentAt: timestamp("sent_at"),
  lastTestSentAt: timestamp("last_test_sent_at"),
  recipientCount: integer("recipient_count").default(0),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cohorts = pgTable("cohorts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Identity
  name: text("name").notNull(),
  displayName: text("display_name"),
  // Default is a safety net for the publish-time migration only (so an
  // existing production row without a slug doesn't block the NOT NULL UNIQUE
  // backfill) — the app always supplies an explicit slug on create.
  slug: text("slug").notNull().unique().default(sql`gen_random_uuid()::text`),
  version: text("version"),
  seriesKey: text("series_key"),
  cohortType: cohortTypeEnum("cohort_type").notNull().default("core"),
  status: cohortStatusEnum("status").notNull().default("draft"),
  // Descriptive / partnership content
  description: text("description"),
  tagline: text("tagline"),
  partnershipNote: text("partnership_note"),
  sponsor: text("sponsor"),
  geography: text("geography"),
  sector: text("sector"),
  year: integer("year"),
  // Branding
  logoUrl: text("logo_url"),
  heroImageUrl: text("hero_image_url"),
  // Eligibility / application configuration (shared question set for now)
  eligibilityCriteria: text("eligibility_criteria"),
  // Cohort-specific extra application questions, appended as an extra step
  // at the end of the application form. Empty array (the default) means the
  // form is unchanged from the shared default.
  extraQuestions: jsonb("extra_questions").$type<ExtraQuestion[]>().notNull().default([]),
  // Dates
  applicationOpenAt: timestamp("application_open_at"),
  applicationCloseAt: timestamp("application_close_at"),
  programStartAt: timestamp("program_start_at"),
  programEndAt: timestamp("program_end_at"),
  // Status flags kept for backward compatibility; kept in sync with `status`
  isActive: boolean("is_active").notNull().default(true),
  isOpen: boolean("is_open").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const courseCohortAssignments = pgTable("course_cohort_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  cohortId: varchar("cohort_id").notNull().references(() => cohorts.id, { onDelete: "cascade" }),
}, (table) => ({
  courseCohortUnique: uniqueIndex("course_cohort_assignments_course_cohort_idx").on(table.courseId, table.cohortId),
}));

export const learningPods = pgTable("learning_pods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cohortId: varchar("cohort_id").notNull().references(() => cohorts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  mentorId: varchar("mentor_id").notNull().references(() => users.id),
  status: learningPodStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  cohortIdx: uniqueIndex("learning_pods_cohort_name_idx").on(table.cohortId, table.name),
}));

export const learningPodMembers = pgTable("learning_pod_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  podId: varchar("pod_id").notNull().references(() => learningPods.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  removedAt: timestamp("removed_at"),
}, (table) => ({
  podUserUnique: uniqueIndex("learning_pod_members_pod_user_idx").on(table.podId, table.userId),
}));

export const learningPodAssignments = pgTable("learning_pod_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  podId: varchar("pod_id").notNull().references(() => learningPods.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  instructions: text("instructions"),
  workType: podWorkTypeEnum("work_type").notNull().default("individual"),
  status: contentStatusEnum("status").notNull().default("published"),
  dueAt: timestamp("due_at"),
  maxScore: integer("max_score").notNull().default(100),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  // Existing pod work is linked into the shared assessment model by the
  // migration, so there is only one conceptual assignment system.
  sharedAssignmentId: varchar("shared_assignment_id"),
});

export const learningPodSubmissions = pgTable("learning_pod_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull().references(() => learningPodAssignments.id, { onDelete: "cascade" }),
  podId: varchar("pod_id").notNull().references(() => learningPods.id, { onDelete: "cascade" }),
  submitterId: varchar("submitter_id").notNull().references(() => users.id),
  submissionText: text("submission_text"),
  submissionUrl: text("submission_url"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  score: integer("score"),
  feedback: text("feedback"),
  evaluatedById: varchar("evaluated_by_id").references(() => users.id),
  evaluatedAt: timestamp("evaluated_at"),
  sharedSubmissionId: varchar("shared_submission_id"),
});

// A durable, cohort-scoped journey record. Applications remain the historical
// admissions baseline; this record stores the participant's programme baseline
// and later progress without overwriting the application.
export const cohortParticipants = pgTable("cohort_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cohortId: varchar("cohort_id").notNull().references(() => cohorts.id, { onDelete: "cascade" }),
  applicationId: varchar("application_id").references(() => applications.id, { onDelete: "set null" }),
  projectName: text("project_name"),
  projectDescription: text("project_description"),
  projectStage: text("project_stage"),
  status: participantProgressStatusEnum("status").notNull().default("active"),
  acceptedAt: timestamp("accepted_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userCohortUnique: uniqueIndex("cohort_participants_user_cohort_idx").on(table.userId, table.cohortId),
}));

export const progressMilestones = pgTable("progress_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").notNull().references(() => cohortParticipants.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  targetAt: timestamp("target_at"),
  status: progressMilestoneStatusEnum("status").notNull().default("planned"),
  evidence: text("evidence"),
  completedAt: timestamp("completed_at"),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ProgressAreaUpdate = {
  status: "not_started" | "emerging" | "progressing" | "strong_progress" | "achieved" | "not_applicable";
  evidence?: string;
};

export const progressReviews = pgTable("progress_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").notNull().references(() => cohortParticipants.id, { onDelete: "cascade" }),
  reviewType: progressReviewTypeEnum("review_type").notNull(),
  status: progressReviewStatusEnum("status").notNull().default("draft"),
  reviewerId: varchar("reviewer_id").references(() => users.id, { onDelete: "set null" }),
  participantReflection: text("participant_reflection"),
  summary: text("summary"),
  achievements: text("achievements"),
  challenges: text("challenges"),
  nextSteps: text("next_steps"),
  areaUpdates: jsonb("area_updates").$type<Record<string, ProgressAreaUpdate>>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  participantReviewUnique: uniqueIndex("progress_reviews_participant_type_idx").on(table.participantId, table.reviewType),
}));

export const progressFeedback = pgTable("progress_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").notNull().references(() => cohortParticipants.id, { onDelete: "cascade" }),
  sourceType: progressFeedbackSourceEnum("source_type").notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  contextType: text("context_type"),
  contextId: varchar("context_id"),
  content: text("content").notNull(),
  visibility: progressFeedbackVisibilityEnum("visibility").notNull().default("participant"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Shared assessment model. The older learningPodAssignments tables remain
// available for existing pod work; these tables support reusable assessments
// across cohorts, pods, courses, and modules.
export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cohortId: varchar("cohort_id").notNull().references(() => cohorts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  instructions: text("instructions"),
  assignmentType: assignmentTypeEnum("assignment_type").notNull(),
  status: contentStatusEnum("status").notNull().default("draft"),
  dueAt: timestamp("due_at"),
  maxScore: integer("max_score").notNull().default(100),
  passingScore: integer("passing_score").notNull().default(70),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const assignmentTargets = pgTable("assignment_targets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull().references(() => assignments.id, { onDelete: "cascade" }),
  targetType: assignmentTargetTypeEnum("target_type").notNull(),
  targetId: varchar("target_id").notNull(),
}, (table) => ({
  assignmentTargetUnique: uniqueIndex("assignment_targets_assignment_type_id_idx").on(table.assignmentId, table.targetType, table.targetId),
}));

export const assignmentQuestions = pgTable("assignment_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull().references(() => assignments.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  questionType: assignmentQuestionTypeEnum("question_type").notNull(),
  options: jsonb("options").$type<string[]>().notNull().default([]),
  correctAnswers: jsonb("correct_answers").$type<string[]>().notNull().default([]),
  points: integer("points").notNull().default(1),
  orderIndex: integer("order_index").notNull().default(0),
});

export type AssignmentFileEvidence = {
  key: string;
  name: string;
  contentType: string;
  size: number;
};

export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull().references(() => assignments.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  podId: varchar("pod_id").references(() => learningPods.id, { onDelete: "set null" }),
  attemptNumber: integer("attempt_number").notNull().default(1),
  status: assignmentSubmissionStatusEnum("status").notNull().default("draft"),
  responseText: text("response_text"),
  links: text("links").array().notNull().default([]),
  fileEvidence: jsonb("file_evidence").$type<AssignmentFileEvidence[]>().notNull().default([]),
  completedAt: timestamp("completed_at"),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  score: integer("score"),
  passed: boolean("passed"),
  feedback: text("feedback"),
  internalNotes: text("internal_notes"),
  reviewedById: varchar("reviewed_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  assignmentUserAttemptUnique: uniqueIndex("assignment_submissions_assignment_user_attempt_idx")
    .on(table.assignmentId, table.userId, table.attemptNumber),
}));

export const assignmentAttemptReconciliationLog = pgTable("assignment_attempt_reconciliation_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull(),
  userId: varchar("user_id").notNull(),
  submissionId: varchar("submission_id").notNull(),
  originalAttemptNumber: integer("original_attempt_number").notNull(),
  reconciledAttemptNumber: integer("reconciled_attempt_number").notNull(),
  duplicateGroupSize: integer("duplicate_group_size").notNull(),
  policy: text("policy").notNull(),
  reconciledAt: timestamp("reconciled_at").notNull().defaultNow(),
}, (table) => ({
  submissionUnique: uniqueIndex("assignment_attempt_reconciliation_log_submission_idx")
    .on(table.submissionId),
  groupIdx: index("assignment_attempt_reconciliation_group_idx")
    .on(table.assignmentId, table.userId, table.reconciledAt),
}));

export const assignmentAnswers = pgTable("assignment_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").notNull().references(() => assignmentSubmissions.id, { onDelete: "cascade" }),
  questionId: varchar("question_id").notNull().references(() => assignmentQuestions.id, { onDelete: "cascade" }),
  answer: jsonb("answer").$type<any>(),
  isCorrect: boolean("is_correct"),
  score: integer("score"),
  feedback: text("feedback"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  submissionQuestionUnique: uniqueIndex("assignment_answers_submission_question_idx").on(table.submissionId, table.questionId),
}));

export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Personal Section
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  countryOfOperation: text("country_of_operation"),
  companyName: text("company_name"),
  roleInCompany: text("role_in_company"),
  personalStatement: text("personal_statement"),
  videoEssayUrl: text("video_essay_url"),
  
  // Section 1: Applicant Background & Sector Experience
  professionalBackground: text("professional_background"),
  yearsOfExperience: integer("years_of_experience"),
  keyResponsibilities: text("key_responsibilities"),
  majorAchievements: text("major_achievements"),
  hasLedTeams: boolean("has_led_teams"),
  teamLeadershipExperience: text("team_leadership_experience"),
  hasProjectExperience: boolean("has_project_experience"),
  projectExperience: text("project_experience"),
  primarySector: text("primary_sector"),
  sectorSpecification: text("sector_specification"),
  subSectors: text("sub_sectors").array(),
  otherSubSector: text("other_sub_sector"),
  
  // Section 2: Business Overview & Scalability
  businessDescription: text("business_description"),
  problemBeingSolved: text("problem_being_solved"),
  businessStage: text("business_stage"),
  tractionEvidence: text("traction_evidence"),
  targetMarket: text("target_market"),
  scalabilityExplanation: text("scalability_explanation"),
  growthPlans: text("growth_plans"),
  isRaisingFunding: boolean("is_raising_funding"),
  
  // Section 2b: Business Ownership & Operations
  companyLegalName: text("company_legal_name"),
  companyCountry: text("company_country"),
  companyHeadquarters: text("company_headquarters"),
  incorporationYear: integer("incorporation_year"),
  ownershipPercentage: integer("ownership_percentage"),
  numberOfShareholders: integer("number_of_shareholders"),
  shareholdersOver25Percent: boolean("shareholders_over_25_percent"),
  
  // Section 3: Financial Documentation & Compliance
  isIncorporated: boolean("is_incorporated"),
  incorporationCertificateUrl: text("incorporation_certificate_url"),
  registrationProofUrl: text("registration_proof_url"),
  revenueStreams: text("revenue_streams"),
  keepsFinancialRecords: boolean("keeps_financial_records"),
  pitchDeckUrl: text("pitch_deck_url"),
  businessPlanUrl: text("business_plan_url"),
  financialStatementsUrl: text("financial_statements_url"),
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
  
  // Section 4b: Business Impact
  businessImpact: text("business_impact"),
  primaryBeneficiaries: text("primary_beneficiaries"),
  infrastructureGapContribution: text("infrastructure_gap_contribution"),
  createsWomenOpportunities: boolean("creates_women_opportunities"),
  womenOpportunitiesDescription: text("women_opportunities_description"),
  
  // Section 5: Support Needs & Project Advancement
  mainChallenges: text("main_challenges"),
  supportAreasNeeded: text("support_areas_needed").array(),
  otherSupportArea: text("other_support_area"),
  keyActivitiesForNextStage: text("key_activities_for_next_stage"),
  fundingRequired: text("funding_required"),
  expectedTimeline: text("expected_timeline"),
  
  // Section 6: Founder Commitment & Peer Support
  specificProgramOutcomes: text("specific_program_outcomes"),
  hoursPerWeek: integer("hours_per_week"),
  openToMentorship: boolean("open_to_mentorship"),
  canCommitToProgram: boolean("can_commit_to_program"),
  canAttendLagosEvent: boolean("can_attend_lagos_event"),
  commitmentManagementPlan: text("commitment_management_plan"),
  willingToMentor: boolean("willing_to_mentor"),
  peerMentorshipImportance: text("peer_mentorship_importance"),
  
  // Final Question
  whyAfaraIsRight: text("why_afara_is_right"),
  
  // Answers to the cohort's extra questions (if any), keyed by question id.
  extraAnswers: jsonb("extra_answers").$type<ExtraAnswers>().notNull().default({}),
  
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
  lastDraftEmailSentAt: timestamp("last_draft_email_sent_at"),
  cohortId: varchar("cohort_id").references(() => cohorts.id),
  resumeToken: text("resume_token").default(sql`gen_random_uuid()`),
});

// Typed attachment stored as JSON in attachmentJson columns
export type PostAttachment =
  | { type: "link"; url: string; title: string }
  | { type: "resource"; resourceId: string; url: string; title: string; resourceType?: string }
  | { type: "event"; eventId: string; url: string; title: string; startTime?: string };

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
export const aiRecommendationEnum = pgEnum("ai_recommendation", ["strong_yes", "yes", "maybe", "no"]);

export const applicationEvaluations = pgTable("application_evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().unique().references(() => applications.id, { onDelete: "cascade" }),
  overallScore: integer("overall_score").notNull(),
  leadershipScore: integer("leadership_score").notNull(),
  businessViabilityScore: integer("business_viability_score").notNull(),
  marketScaleScore: integer("market_scale_score").notNull(),
  energyInfraImpactScore: integer("energy_infra_impact_score").notNull(),
  programReadinessScore: integer("program_readiness_score").notNull(),
  summary: text("summary").notNull(),
  strengths: text("strengths").array().notNull(),
  concerns: text("concerns").array().notNull(),
  recommendation: aiRecommendationEnum("recommendation").notNull(),
  evaluatedAt: timestamp("evaluated_at").notNull().defaultNow(),
  evaluatedByModel: text("evaluated_by_model").notNull(),
});

export const insertCertificateSchema = createInsertSchema(certificates).omit({ id: true });
export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({ id: true, subscribedAt: true });
export const insertNewsletterCampaignSchema = createInsertSchema(newsletterCampaigns).omit({ id: true, createdAt: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ 
  id: true, 
  reviewedAt: true, 
  reviewedById: true,
  reviewNotes: true,
  resumeToken: true,
}).extend({
  extraAnswers: extraAnswersSchema.optional(),
});
export const insertApplicationEvaluationSchema = createInsertSchema(applicationEvaluations).omit({ id: true, evaluatedAt: true });

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
export type CourseAudience = "all" | "selected";
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
export type EventFacilitator = typeof eventFacilitators.$inferSelect;
export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resources.$inferSelect;
export type PrivateVideoUpload = typeof privateVideoUploads.$inferSelect;
export type InsertPrivateVideoUpload = typeof privateVideoUploads.$inferInsert;
export type ZoomWebhookEvent = typeof zoomWebhookEvents.$inferSelect;
export type ZoomOAuthConnection = typeof zoomOAuthConnections.$inferSelect;
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
export type InsertApplicationEvaluation = z.infer<typeof insertApplicationEvaluationSchema>;
export type ApplicationEvaluation = typeof applicationEvaluations.$inferSelect;

export const insertCohortSchema = createInsertSchema(cohorts)
  .omit({ id: true, createdAt: true })
  .extend({
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    name: z.string().trim().min(1, "Name is required"),
    extraQuestions: extraQuestionsListSchema.optional(),
  });
export type InsertCohort = z.infer<typeof insertCohortSchema>;
export type Cohort = typeof cohorts.$inferSelect;
export const insertLearningPodSchema = createInsertSchema(learningPods).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLearningPodMemberSchema = createInsertSchema(learningPodMembers).omit({ id: true, joinedAt: true, removedAt: true });
export const insertLearningPodAssignmentSchema = createInsertSchema(learningPodAssignments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLearningPodSubmissionSchema = createInsertSchema(learningPodSubmissions).omit({ id: true, submittedAt: true, updatedAt: true, score: true, feedback: true, evaluatedById: true, evaluatedAt: true });
export const insertCohortParticipantSchema = createInsertSchema(cohortParticipants).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProgressMilestoneSchema = createInsertSchema(progressMilestones).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProgressReviewSchema = createInsertSchema(progressReviews).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProgressFeedbackSchema = createInsertSchema(progressFeedback).omit({ id: true, createdAt: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssignmentTargetSchema = createInsertSchema(assignmentTargets).omit({ id: true });
export const insertAssignmentQuestionSchema = createInsertSchema(assignmentQuestions).omit({ id: true });
export const insertAssignmentSubmissionSchema = createInsertSchema(assignmentSubmissions).omit({
  id: true, attemptNumber: true, createdAt: true, updatedAt: true, completedAt: true, submittedAt: true,
  reviewedAt: true, score: true, passed: true, feedback: true, internalNotes: true, reviewedById: true,
});
export const insertAssignmentAnswerSchema = createInsertSchema(assignmentAnswers).omit({ id: true, updatedAt: true });
export type LearningPod = typeof learningPods.$inferSelect;
export type InsertLearningPod = z.infer<typeof insertLearningPodSchema>;
export type LearningPodMember = typeof learningPodMembers.$inferSelect;
export type InsertLearningPodMember = z.infer<typeof insertLearningPodMemberSchema>;
export type LearningPodAssignment = typeof learningPodAssignments.$inferSelect;
export type InsertLearningPodAssignment = z.infer<typeof insertLearningPodAssignmentSchema>;
export type LearningPodSubmission = typeof learningPodSubmissions.$inferSelect;
export type InsertLearningPodSubmission = z.infer<typeof insertLearningPodSubmissionSchema>;
export type CohortParticipant = typeof cohortParticipants.$inferSelect;
export type InsertCohortParticipant = z.infer<typeof insertCohortParticipantSchema>;
export type ProgressMilestone = typeof progressMilestones.$inferSelect;
export type InsertProgressMilestone = z.infer<typeof insertProgressMilestoneSchema>;
export type ProgressReview = typeof progressReviews.$inferSelect;
export type InsertProgressReview = z.infer<typeof insertProgressReviewSchema>;
export type ProgressFeedback = typeof progressFeedback.$inferSelect;
export type InsertProgressFeedback = z.infer<typeof insertProgressFeedbackSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type AssignmentTarget = typeof assignmentTargets.$inferSelect;
export type InsertAssignmentTarget = z.infer<typeof insertAssignmentTargetSchema>;
export type AssignmentQuestion = typeof assignmentQuestions.$inferSelect;
export type InsertAssignmentQuestion = z.infer<typeof insertAssignmentQuestionSchema>;
export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type InsertAssignmentSubmission = z.infer<typeof insertAssignmentSubmissionSchema>;
export type AssignmentAnswer = typeof assignmentAnswers.$inferSelect;
export type InsertAssignmentAnswer = z.infer<typeof insertAssignmentAnswerSchema>;
