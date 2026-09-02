import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage, LearningPodMembershipConflictError } from "./storage";
import { authenticateUser, createUserWithPassword } from "./auth";
import { 
  insertUserSchema, insertProfileSchema, insertMentorProfileSchema, insertFacilitatorProfileSchema,
  insertCourseSchema, insertModuleSchema, insertLessonSchema, insertEnrollmentSchema,
  insertMentorshipRequestSchema, insertMentorshipSessionSchema,
  insertEventSchema, insertEventRegistrationSchema, insertResourceSchema,
  insertDiscussionThreadSchema, insertDiscussionPostSchema, insertCertificateSchema,
  insertNotificationSchema, insertApplicationSchema, insertCohortSchema,
  insertLearningPodSchema, insertLearningPodAssignmentSchema, insertLearningPodSubmissionSchema,
  extraAnswersSchema,
  type Cohort, type Event
} from "@shared/schema";
import { z } from "zod";
import { createHash, createHmac, randomUUID, timingSafeEqual } from "crypto";
import {
  downloadZoomRecording as downloadZoomRecordingFile,
  createZoomMeeting,
  deleteZoomMeeting,
  decryptZoomToken,
  encryptZoomToken,
  exchangeZoomAuthorizationCode,
  getZoomAuthorizationUrl,
  getZoomUser,
  refreshZoomAccessToken,
  updateZoomMeeting,
  type ZoomMeeting,
  type ZoomMeetingInput,
  type ZoomRecordingDownloadInput,
  type ZoomRecordingDownload,
} from "./zoom";
import {
  authorizePlayback,
  canAccessVisibility,
  createPlaybackToken,
  isPlaybackTokenAuthorized,
  readPlaybackToken,
  resourceIsRestricted,
} from "./playback-auth";
import {
  getYouTubeVideo,
  parseYouTubeVideoId,
  startYouTubeResumableUpload,
  uploadYouTubeChunk,
  getYouTubeUploadStatus,
  type YouTubePrivacyStatus,
  type YouTubeVideoMetadata,
} from "./youtube";
import { isPrivateVideoStorageKey } from "./r2-storage";
import {
  isObjectStorageConfigured,
  isObjectStorageAvailable as checkObjectStorageAvailable,
  uploadPrivateVideo,
  getObjectStorageFileStream,
  deleteObjectStorageFile,
  listObjectStoragePrivateVideoFiles,
} from "./object-storage";
import {
  DEFAULT_NEWSLETTER_AUDIENCE,
  renderNewsletterHtml,
  type NewsletterAudience,
  type NewsletterBlock,
} from "@shared/newsletter";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const courseAssignmentSchema = z.object({
  audience: z.enum(["all", "selected"]).default("all"),
  cohortIds: z.array(z.string().min(1)).default([]),
}).superRefine((assignment, ctx) => {
  if (assignment.audience === "selected" && assignment.cohortIds.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cohortIds"],
      message: "Select at least one cohort, or make the course available to all participants.",
    });
  }
});

const learningPodPayloadSchema = insertLearningPodSchema.extend({
  cohortId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).nullable().optional(),
  mentorId: z.string().min(1),
  status: z.enum(["active", "archived"]).default("active"),
});

const learningPodMembersSchema = z.object({
  userIds: z.array(z.string().min(1)).max(100),
});

const learningPodAutoDistributeSchema = z.object({
  cohortId: z.string().min(1),
  podSize: z.number().int().min(3).max(5),
  mentorIds: z.array(z.string().min(1)).min(1).max(50),
  namePrefix: z.string().trim().min(1).max(80).default("Learning Pod"),
});

const learningPodAssignmentPayloadSchema = insertLearningPodAssignmentSchema.extend({
  title: z.string().trim().min(1).max(200),
  instructions: z.string().trim().max(10000).nullable().optional(),
  workType: z.enum(["individual", "group"]).default("individual"),
  status: z.enum(["draft", "published"]).default("published"),
  dueAt: z.string().datetime().nullable().optional(),
  maxScore: z.number().int().min(1).max(10000).default(100),
});

const learningPodSubmissionPayloadSchema = insertLearningPodSubmissionSchema.omit({
  assignmentId: true,
  podId: true,
  submitterId: true,
}).extend({
  submissionText: z.string().trim().max(20000).nullable().optional(),
  submissionUrl: z.string().trim().url().max(2000).nullable().optional(),
}).refine((value) => Boolean(value.submissionText || value.submissionUrl), {
  message: "Add written work or a submission link.",
});

const learningPodReviewSchema = z.object({
  score: z.number().int().min(0).max(10000),
  feedback: z.string().trim().min(1).max(10000),
});

const youtubeVideoResourceSchema = insertResourceSchema.superRefine((resource, ctx) => {
  if (resource.resourceType === "video") {
    const source = resource.videoSource || (resource.youtubeVideoId ? "youtube" : "upload");
    if (source !== "youtube" && source !== "upload") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["videoSource"],
        message: "Choose YouTube or private hosted playback for video resources.",
      });
      return;
    }
    if (source === "upload" && !resource.videoStorageKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["videoStorageKey"],
        message: "A private video upload is required for protected video resources.",
      });
    }
    if (source === "youtube" && !resource.youtubeVideoId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["youtubeVideoId"],
        message: "A YouTube video is required for YouTube video resources.",
      });
    }
    if (resource.visibility !== "public" && source !== "upload") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["videoSource"],
        message: "Restricted videos must use private hosted playback.",
      });
    }
  }
});

const youtubeUploadMetadataSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().max(5000).optional(),
  privacyStatus: z.enum(["public", "unlisted", "private"]).default("unlisted"),
});

const YOUTUBE_UPLOAD_CHUNK_SIZE = 8 * 1024 * 1024;
const MAX_YOUTUBE_UPLOAD_SIZE = 10 * 1024 * 1024 * 1024;
const YOUTUBE_UPLOAD_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const PRIVATE_VIDEO_UPLOAD_RETENTION_MS = 24 * 60 * 60 * 1000;
const PRIVATE_VIDEO_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const youtubeResumableUploadSchema = youtubeUploadMetadataSchema.extend({
  fileSize: z.number().int().positive().max(MAX_YOUTUBE_UPLOAD_SIZE),
  contentType: z.string().trim().regex(/^video\//).max(100),
});

export interface ResourceLifecycleDependencies {
  deletePrivateVideo?: (storageKey: string) => Promise<void>;
  listPrivateVideoFiles?: () => Promise<string[]>;
  downloadZoomRecording?: (input: ZoomRecordingDownloadInput) => Promise<ZoomRecordingDownload>;
  uploadPrivateVideo?: (key: string, body: Buffer, contentType: string) => Promise<{ key: string }>;
  logError?: (...args: unknown[]) => void;
}

interface YouTubeUploadSession {
  userId: string;
  sessionPath: string;
  totalBytes: number;
  contentType: string;
  nextByte: number;
  status: "uploading" | "completed";
  video?: YouTubeVideoMetadata;
  expiresAt: number;
  operation: Promise<void>;
}

const youtubeUploadSessions = new Map<string, YouTubeUploadSession>();

function removeExpiredYouTubeUploadSessions(): void {
  const now = Date.now();
  for (const [uploadId, session] of Array.from(youtubeUploadSessions.entries())) {
    if (session.expiresAt <= now) youtubeUploadSessions.delete(uploadId);
  }
}

/**
 * Returns the canonical application base URL used for security-sensitive emails
 * (password reset links, login notifications, etc.).
 *
 * The value MUST come from the APP_BASE_URL environment variable so it is never
 * derived from attacker-supplied request headers (Origin, Host, Referer, etc.).
 * If the variable is unset, the function throws so callers can return a 500 and
 * log the misconfiguration rather than silently building a poisoned URL.
 */
function getAppBaseUrl(): string {
  const configured = process.env.APP_BASE_URL;
  if (!configured) {
    console.error(
      "SECURITY: APP_BASE_URL environment variable is not set. " +
      "Security-sensitive emails cannot be sent safely without a trusted base URL."
    );
    throw new Error("APP_BASE_URL is not configured");
  }
  return configured.replace(/\/+$/, ""); // strip trailing slashes
}

function getZoomWebhookSecret(): string {
  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
  if (!secret) {
    throw new Error("ZOOM_WEBHOOK_SECRET_TOKEN is not configured");
  }
  return secret;
}

function getZoomRedirectUri(): string {
  const configured = process.env.ZOOM_REDIRECT_URI;
  if (configured) return configured.replace(/\/+$/, "");

  const appBaseUrl = process.env.APP_BASE_URL;
  if (appBaseUrl) return `${appBaseUrl.replace(/\/+$/, "")}/api/integrations/zoom/callback`;

  if (process.env.NODE_ENV !== "production" && process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}/api/integrations/zoom/callback`;
  }

  throw new Error(
    "ZOOM_REDIRECT_URI or APP_BASE_URL must be configured before connecting Zoom.",
  );
}

function isZoomMeetingPlatform(platform: string | null | undefined): boolean {
  return typeof platform === "string" && platform.trim().toLowerCase() === "zoom";
}

async function getConnectedZoomAccessToken(): Promise<string> {
  const connection = await storage.getZoomOAuthConnection();
  if (!connection) {
    throw new Error("Zoom is not connected. Connect the AFÁRÁ Zoom account first.");
  }

  let accessToken = decryptZoomToken(connection.accessToken);
  if (connection.accessTokenExpiresAt.getTime() <= Date.now() + 60_000) {
    const refreshToken = decryptZoomToken(connection.refreshToken);
    let refreshed;
    try {
      refreshed = await refreshZoomAccessToken(refreshToken);
    } catch {
      throw new Error(
        "Zoom authorization has expired or is invalid. Reconnect the AFÁRÁ Zoom account and try again.",
      );
    }
    await storage.saveZoomOAuthConnection({
      accessToken: encryptZoomToken(refreshed.accessToken),
      refreshToken: encryptZoomToken(refreshed.refreshToken),
      accessTokenExpiresAt: new Date(Date.now() + refreshed.expiresInSeconds * 1000),
      scope: refreshed.scope ?? connection.scope,
      zoomUserId: connection.zoomUserId,
      zoomUserEmail: connection.zoomUserEmail,
    });
    accessToken = refreshed.accessToken;
  }
  return accessToken;
}

type ZoomEventFields = {
  title: string;
  description?: string | null;
  startTime: Date;
  endTime?: Date | null;
  durationMinutes?: number | null;
  meetingPlatform?: string | null;
  meetingLink?: string | null;
  zoomMeetingId?: string | null;
};

function getZoomMeetingInput(event: ZoomEventFields): ZoomMeetingInput {
  return {
    topic: event.title,
    agenda: event.description,
    startTime: event.startTime,
    endTime: event.endTime,
    durationMinutes: event.durationMinutes,
  };
}

async function provisionZoomMeeting(
  event: ZoomEventFields,
): Promise<{ meeting?: ZoomMeeting; created: boolean }> {
  if (!isZoomMeetingPlatform(event.meetingPlatform)) {
    return { created: false };
  }

  // A supplied link without an existing Zoom ID is intentionally treated as a
  // manually managed meeting. Leaving it blank opts into automatic creation.
  if (event.meetingLink && !event.zoomMeetingId) {
    return { created: false };
  }

  const accessToken = await getConnectedZoomAccessToken();
  const input = getZoomMeetingInput(event);
  if (event.zoomMeetingId) {
    return {
      meeting: await updateZoomMeeting(accessToken, event.zoomMeetingId, input),
      created: false,
    };
  }
  return {
    meeting: await createZoomMeeting(accessToken, input),
    created: true,
  };
}

function getZoomFailureMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Zoom meeting synchronization failed.";
}

function hasValidZoomWebhookSignature(req: Request, rawBody: Buffer, secret: string): boolean {
  const timestamp = req.header("x-zm-request-timestamp");
  const signature = req.header("x-zm-signature");
  if (!timestamp || !signature) return false;

  const timestampMs = Number(timestamp) * 1000;
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return false;
  }

  const message = `v0:${timestamp}:${rawBody.toString("utf8")}`;
  const expected = `v0=${createHmac("sha256", secret).update(message).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  return expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer);
}

type ZoomRecordingFilePayload = {
  id?: unknown;
  meeting_id?: unknown;
  file_type?: unknown;
  file_extension?: unknown;
  file_size?: unknown;
  download_url?: unknown;
  download_token?: unknown;
  status?: unknown;
  recording_type?: unknown;
};

function asRecord(value: unknown): Record<string, any> | null {
  return typeof value === "object" && value !== null ? value as Record<string, any> : null;
}

function normalizedMeetingIdentifier(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const normalized = String(value).trim().toLowerCase();
  return normalized || null;
}

function getZoomMeetingIdentifiers(value: unknown): Set<string> {
  const identifiers = new Set<string>();
  const add = (candidate: unknown) => {
    const normalized = normalizedMeetingIdentifier(candidate);
    if (normalized) identifiers.add(normalized);
  };
  add(value);
  if (typeof value === "string") {
    try {
      const url = new URL(value);
      for (const key of ["id", "meetingId", "meeting_id", "confno"]) add(url.searchParams.get(key));
      const pathParts = url.pathname.split("/").filter(Boolean);
      for (const part of pathParts) {
        if (/^\d{6,}$/.test(part)) add(part);
      }
    } catch {
      // A stored meeting ID is allowed to be a plain string.
    }
  }
  return identifiers;
}

function normalizeTopic(value: unknown): string {
  return typeof value === "string"
    ? value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
    : "";
}

function selectZoomVideoFile(files: ZoomRecordingFilePayload[]): ZoomRecordingFilePayload | undefined {
  return files
    .filter((file) => {
      const status = typeof file.status === "string" ? file.status.toLowerCase() : "completed";
      const type = typeof file.file_type === "string" ? file.file_type.toLowerCase() : "";
      const extension = typeof file.file_extension === "string" ? file.file_extension.toLowerCase() : "";
      return status === "completed" && (type === "mp4" || extension === "mp4") &&
        typeof file.download_url === "string" && file.download_url.length > 0;
    })
    .sort((left, right) => Number(right.file_size || 0) - Number(left.file_size || 0))[0];
}

async function uploadProtectedZoomVideo(
  dependencies: ResourceLifecycleDependencies,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<{ key: string }> {
  if (dependencies.uploadPrivateVideo) {
    return dependencies.uploadPrivateVideo(key, body, contentType);
  }
  const { isR2Configured, uploadFile } = await import("./r2-storage");
  if (isR2Configured()) {
    const result = await uploadFile(key, body, contentType, false);
    return { key: result.key };
  }
  if (!isObjectStorageConfigured() || !(await checkObjectStorageAvailable())) {
    throw new Error("Protected video storage is not available.");
  }
  return uploadPrivateVideo(key, body, contentType);
}

export async function processZoomRecordingWebhook(
  eventId: string,
  dependencies: ResourceLifecycleDependencies,
): Promise<void> {
  let claimed: Awaited<ReturnType<typeof storage.claimZoomWebhookEvent>>;
  try {
    claimed = await storage.claimZoomWebhookEvent(eventId);
  } catch (error) {
    (dependencies.logError ?? console.error)(
      `Failed to claim Zoom webhook ${eventId}.`,
      error instanceof Error ? error.message : "unknown error",
    );
    return;
  }
  if (!claimed) return;

  try {
    const payload = asRecord(claimed.payload);
    const zoomPayload = asRecord(payload?.payload);
    const zoomObject = asRecord(zoomPayload?.object);
    if (!zoomObject) throw new Error("Zoom recording payload is missing its meeting object.");

    const recordingFiles = Array.isArray(zoomObject.recording_files)
      ? zoomObject.recording_files as ZoomRecordingFilePayload[]
      : [];
    const recordingFile = selectZoomVideoFile(recordingFiles);
    if (!recordingFile || typeof recordingFile.download_url !== "string") {
      throw new Error("Zoom recording payload does not contain a completed MP4 file.");
    }

    const zoomIdentifiers = new Set<string>();
    for (const candidate of [zoomObject.id, zoomObject.uuid, recordingFile.meeting_id]) {
      getZoomMeetingIdentifiers(candidate).forEach((identifier) => zoomIdentifiers.add(identifier));
    }
    const topic = normalizeTopic(zoomObject.topic);
    const allEvents = await storage.getAllEvents();
    const matchingEvents = allEvents.filter((event) => {
      const eventIdentifiers = new Set<string>();
      for (const identifierSource of [event.zoomMeetingId, event.meetingLink]) {
        getZoomMeetingIdentifiers(identifierSource).forEach((identifier) => eventIdentifiers.add(identifier));
      }
      return Array.from(zoomIdentifiers).some((identifier) => eventIdentifiers.has(identifier));
    });
    let event = matchingEvents[0];
    if (!event && topic) {
      const topicMatches = allEvents.filter((candidate) => normalizeTopic(candidate.title) === topic);
      if (topicMatches.length === 1) event = topicMatches[0];
    }
    if (!event) throw new Error("No AFÁRÁ event matches this Zoom meeting.");

    const sourceId = typeof recordingFile.id === "string" && recordingFile.id
      ? recordingFile.id
      : recordingFile.download_url;
    const storageKey = `resources/private-videos/zoom-${createHash("sha256").update(sourceId).digest("hex")}.mp4`;
    let resource = event.recordingResourceId
      ? await storage.getResource(event.recordingResourceId)
      : undefined;
    if (!resource) resource = await storage.getResourceByVideoStorageKey(`private/${storageKey}`);

    if (!resource) {
      const downloadToken = [
        recordingFile.download_token,
        zoomObject.download_token,
        zoomPayload?.download_token,
        payload?.download_token,
      ].find((value): value is string => typeof value === "string" && value.length > 0);
      const downloaded = await (dependencies.downloadZoomRecording || downloadZoomRecordingFile)({
        downloadUrl: recordingFile.download_url,
        downloadToken,
      });
      const stored = await uploadProtectedZoomVideo(
        dependencies,
        storageKey,
        downloaded.body,
        downloaded.contentType,
      );
      await storage.trackPrivateVideoUpload(stored.key, null);
      resource = await storage.createResource({
        title: `${event.title} — Zoom recording`,
        description: `Automatically imported from Zoom after the ${event.title} session.`,
        resourceType: "video",
        category: "event-recording",
        fileUrl: null,
        fileName: `${event.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "event"}-recording.mp4`,
        fileSize: downloaded.fileSize,
        thumbnailUrl: null,
        uploadedById: null,
        visibility: event.visibility,
        status: "published",
        videoSource: "upload",
        videoStorageKey: stored.key,
        videoContentType: downloaded.contentType,
        videoFileSize: downloaded.fileSize,
      });
    }

    if (resource.resourceType !== "video" || resource.videoSource !== "upload" || !resource.videoStorageKey) {
      throw new Error("The existing Zoom recording resource is not configured for protected playback.");
    }
    await storage.claimPrivateVideoUpload(resource.videoStorageKey, resource.id);

    if (event.recordingLessonId) {
      const lesson = await storage.getLesson(event.recordingLessonId);
      if (!lesson) throw new Error("The selected course lesson no longer exists.");
      if (lesson.lessonType !== "video") throw new Error("The selected course lesson is not a video lesson.");
      if (lesson.resourceId && lesson.resourceId !== resource.id) {
        throw new Error("The selected course lesson already has a different resource.");
      }
      if (lesson.resourceId !== resource.id) {
        await storage.updateLesson(lesson.id, { resourceId: resource.id, videoSource: null, videoUrl: null, videoId: null });
      }
    }

    const updatedEvent = await storage.updateEvent(event.id, { recordingResourceId: resource.id });
    if (!updatedEvent) throw new Error("The matching AFÁRÁ event could not be updated.");
    await storage.markZoomWebhookEventCompleted(eventId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Zoom recording import failed.";
    try {
      await storage.markZoomWebhookEventFailed(eventId, message);
    } catch (statusError) {
      (dependencies.logError ?? console.error)(
        "Failed to record Zoom webhook processing failure.",
        statusError instanceof Error ? statusError.message : "unknown error",
      );
    }
    (dependencies.logError ?? console.error)(`Failed to import Zoom recording webhook ${eventId}.`, message);
  }
}

function safeZoomErrorSummary(error: string | null): string | null {
  if (!error) return null;
  return error.replace(/\s+/g, " ").trim().slice(0, 240) || null;
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1)
});

export async function registerRoutes(
  app: Express,
  dependencies: ResourceLifecycleDependencies = {},
): Promise<Server> {
  
  // Health check endpoint for Railway/production monitoring
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Zoom sends endpoint.url_validation before activating a subscription, then
  // signs every subsequent notification with the same secret token.
  app.post("/api/integrations/zoom/webhook", async (req: Request, res: Response) => {
    try {
      const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
      if (!rawBody) {
        return res.status(400).json({ error: "Raw webhook body is required" });
      }

      const secret = getZoomWebhookSecret();
      if (!hasValidZoomWebhookSignature(req, rawBody, secret)) {
        return res.status(401).json({ error: "Invalid Zoom webhook signature" });
      }

      if (req.body?.event === "endpoint.url_validation") {
        const plainToken = req.body?.payload?.plainToken;
        if (typeof plainToken !== "string" || !plainToken) {
          return res.status(400).json({ error: "Zoom validation token is missing" });
        }
        const encryptedToken = createHmac("sha256", secret)
          .update(plainToken)
          .digest("hex");
        return res.json({ plainToken, encryptedToken });
      }

      const eventType = typeof req.body?.event === "string"
        ? req.body.event
        : "unknown";
      const eventId = typeof req.body?.event_id === "string" && req.body.event_id
        ? req.body.event_id
        : createHash("sha256").update(rawBody).digest("hex");
      const inserted = await storage.recordZoomWebhookEvent({
        eventId,
        eventType,
        payload: req.body,
      });

      if (eventType === "recording.completed") {
        console.info(`Zoom recording webhook ${inserted ? "received" : "deduplicated"}`, {
          eventId,
          meetingUuid: req.body?.payload?.object?.uuid,
        });
        // Acknowledge Zoom before doing network and object-storage work. The
        // durable receipt claim below makes both new deliveries and retries
        // safe, including a process restart during the import.
        void processZoomRecordingWebhook(eventId, dependencies);
      }

      return res.status(200).json({
        received: true,
        duplicate: !inserted,
        message: inserted
          ? "Zoom notification received."
          : "Zoom notification already received; the existing import was kept.",
      });
    } catch (error) {
      console.error("Zoom webhook handling failed:", error);
      return res.status(503).json({ error: "Zoom webhook is not configured" });
    }
  });

  // Auth Routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await authenticateUser(email, password);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      if (!user.isActive) {
        return res.status(403).json({ error: "Account is deactivated" });
      }
      
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.mustChangePassword = user.mustChangePassword ?? false;
      
      const { passwordHash, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      const user = await createUserWithPassword(email, password, firstName, lastName, "participant");
      
      // Only auto-login the new user if no one is currently logged in
      // (avoids overwriting an admin's session when they create users)
      if (!req.session.userId) {
        req.session.userId = user.id;
        req.session.userRole = user.role;
      }
      
      const { passwordHash, ...safeUser } = user;
      res.status(201).json({ user: safeUser });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email is required" });
      }
      const user = await storage.getUserByEmail(email.toLowerCase().trim());
      // Always respond success to avoid user enumeration
      if (!user || !user.isActive) {
        return res.json({ success: true });
      }
      const { randomBytes } = await import("crypto");
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await storage.updateUser(user.id, {
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt,
      } as any);
      const baseUrl = getAppBaseUrl();
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;
      const { sendPasswordResetEmail } = await import("./email");
      await sendPasswordResetEmail(user.email, user.firstName, resetUrl);
      res.json({ success: true });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process request" });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;
      if (!token || !password || typeof token !== "string" || typeof password !== "string") {
        return res.status(400).json({ error: "Token and password are required" });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      const user = await storage.getUserByResetToken(token);
      if (!user || !user.passwordResetExpiresAt) {
        return res.status(400).json({ error: "Invalid or expired reset link" });
      }
      if (new Date() > new Date(user.passwordResetExpiresAt)) {
        return res.status(400).json({ error: "This reset link has expired. Please request a new one." });
      }
      const { hashPassword } = await import("./auth");
      const passwordHash = await hashPassword(password);
      await storage.updateUser(user.id, {
        passwordHash,
        mustChangePassword: false,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      } as any);
      res.json({ success: true });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.post("/api/auth/change-password", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      const { newPassword } = req.body;
      if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters" });
      }
      const { hashPassword } = await import("./auth");
      const passwordHash = await hashPassword(newPassword);
      const updated = await storage.updateUser(req.session.userId, {
        passwordHash,
        mustChangePassword: false,
      });
      if (!updated) return res.status(404).json({ error: "User not found" });
      req.session.mustChangePassword = false;
      const { passwordHash: _ph, ...safeUser } = updated;
      res.json({ user: safeUser });
    } catch (error) {
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "User not found" });
    }
    
    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser });
  });

  // --- Auth middleware helpers ---
  // Checks session identity and then re-validates mustChangePassword against the
  // authoritative database record so stale session state cannot be exploited
  // (e.g. when an admin resets a password while a user session is still live).
  const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || !user.isActive) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: "Authentication required" });
      }
      if (user.mustChangePassword) {
        // Keep session flag in sync so the client can detect this too
        req.session.mustChangePassword = true;
        return res.status(403).json({ error: "Password change required before accessing the platform" });
      }
      next();
    } catch (err) {
      console.error("requireAuth DB lookup failed:", err);
      return res.status(500).json({ error: "Authentication check failed" });
    }
  };

  const requireAdminRole = (req: Request, res: Response, next: NextFunction) => {
    const role = req.session?.userRole;
    if (!role || (role !== "admin" && role !== "superadmin")) {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  };

  const requireSuperAdminRole = (req: Request, res: Response, next: NextFunction) => {
    const role = req.session?.userRole;
    if (role !== "superadmin") {
      return res.status(403).json({ error: "Super admin access required" });
    }
    next();
  };

  // Strip security-sensitive fields before returning a user object in an API response
  const sanitizeUser = (user: Record<string, any>) => {
    const { passwordHash, passwordResetToken, passwordResetExpiresAt, mustChangePassword, ...safe } = user;
    return safe;
  };

  const isAdminSession = (req: Request) => {
    const role = req.session?.userRole as string | undefined;
    return role === "admin" || role === "superadmin";
  };

  const getZoomAdminStatus = async () => {
    const [webhooks, allEvents] = await Promise.all([
      storage.getRecentZoomWebhookEvents(50),
      storage.getAllEvents(),
    ]);

    const events = webhooks.map((webhook) => {
      const payload = asRecord(webhook.payload);
      const zoomPayload = asRecord(payload?.payload);
      const zoomObject = asRecord(zoomPayload?.object);
      const identifiers = new Set<string>();
      for (const candidate of [zoomObject?.id, zoomObject?.uuid]) {
        getZoomMeetingIdentifiers(candidate).forEach((identifier) => identifiers.add(identifier));
      }
      const recordingFiles = Array.isArray(zoomObject?.recording_files)
        ? zoomObject.recording_files as ZoomRecordingFilePayload[]
        : [];
      recordingFiles.forEach((file) => {
        getZoomMeetingIdentifiers(file.meeting_id).forEach((identifier) => identifiers.add(identifier));
      });
      const matchedEvent = allEvents.find((event) => {
        const eventIdentifiers = new Set<string>();
        for (const source of [event.zoomMeetingId, event.meetingLink]) {
          getZoomMeetingIdentifiers(source).forEach((identifier) => eventIdentifiers.add(identifier));
        }
        return Array.from(identifiers).some((identifier) => eventIdentifiers.has(identifier));
      });

      return {
        id: webhook.id,
        eventId: webhook.eventId,
        eventType: webhook.eventType,
        status: webhook.status,
        receivedAt: webhook.receivedAt,
        processingStartedAt: webhook.processingStartedAt,
        processedAt: webhook.processedAt,
        error: safeZoomErrorSummary(webhook.error),
        eventTitle: matchedEvent?.title || null,
      };
    });

    return {
      events,
      counts: {
        waiting: events.filter((event) =>
          event.eventType === "recording.completed" && event.status === "received"
        ).length,
        importing: events.filter((event) =>
          event.eventType === "recording.completed" && event.status === "processing"
        ).length,
        complete: events.filter((event) =>
          event.eventType === "recording.completed" && event.status === "completed"
        ).length,
        failed: events.filter((event) =>
          event.eventType === "recording.completed" && event.status === "failed"
        ).length,
      },
    };
  };

  app.get(
    "/api/admin/integrations/zoom/connect",
    requireAuth,
    requireAdminRole,
    (req: Request, res: Response) => {
      try {
        const state = randomUUID();
        req.session.zoomOAuthState = state;
        const authorizationUrl = getZoomAuthorizationUrl(getZoomRedirectUri(), state);
        req.session.save((error) => {
          if (error) {
            console.error("Failed to save Zoom OAuth session state:", error);
            return res.status(500).json({ error: "Could not start Zoom connection." });
          }
          res.redirect(authorizationUrl);
        });
      } catch (error) {
        console.error("Failed to start Zoom OAuth:", error);
        res.status(503).json({ error: getZoomFailureMessage(error) });
      }
    },
  );

  app.get("/api/integrations/zoom/callback", async (req: Request, res: Response) => {
    const redirectToEvents = (status: "connected" | "error", message?: string) => {
      const query = new URLSearchParams({ zoom: status });
      if (message) query.set("message", message);
      return res.redirect(`/admin/events?${query.toString()}`);
    };

    const receivedState = typeof req.query.state === "string" ? req.query.state : "";
    const expectedState = req.session.zoomOAuthState;
    delete req.session.zoomOAuthState;
    if (!expectedState || !receivedState || expectedState !== receivedState) {
      return redirectToEvents("error", "The Zoom connection session expired. Please try again.");
    }

    if (typeof req.query.error === "string") {
      return redirectToEvents("error", "Zoom authorization was cancelled.");
    }

    const code = typeof req.query.code === "string" ? req.query.code : "";
    if (!code) return redirectToEvents("error", "Zoom did not return an authorization code.");

    try {
      const redirectUri = getZoomRedirectUri();
      const tokens = await exchangeZoomAuthorizationCode(code, redirectUri);
      let zoomUser: { id?: string; email?: string } = {};
      try {
        zoomUser = await getZoomUser(tokens.accessToken);
      } catch (error) {
        // Meeting scopes are sufficient for this integration. User profile
        // metadata is helpful in the admin UI but should not block connection.
        console.warn("Zoom profile lookup skipped after OAuth:", getZoomFailureMessage(error));
      }
      await storage.saveZoomOAuthConnection({
        accessToken: encryptZoomToken(tokens.accessToken),
        refreshToken: encryptZoomToken(tokens.refreshToken),
        accessTokenExpiresAt: new Date(Date.now() + tokens.expiresInSeconds * 1000),
        scope: tokens.scope,
        zoomUserId: zoomUser.id,
        zoomUserEmail: zoomUser.email,
      });
      return redirectToEvents("connected");
    } catch (error) {
      console.error("Zoom OAuth callback failed:", error);
      return redirectToEvents("error", "AFÁRÁ could not complete the Zoom connection.");
    }
  });

  app.get(
    "/api/admin/integrations/zoom/status",
    requireAuth,
    requireAdminRole,
    async (_req: Request, res: Response) => {
      try {
        const [connection, recordingSync] = await Promise.all([
          storage.getZoomOAuthConnection(),
          getZoomAdminStatus(),
        ]);
        res.json({
          connected: Boolean(connection),
          accountEmail: connection?.zoomUserEmail ?? null,
          connectedAt: connection?.createdAt ?? null,
          tokenExpiresAt: connection?.accessTokenExpiresAt ?? null,
          ...recordingSync,
        });
      } catch (error) {
        console.error("Failed to read Zoom connection status:", error);
        res.status(500).json({ error: "Failed to read Zoom and recording sync status." });
      }
    },
  );

  app.post(
    "/api/admin/integrations/zoom/webhooks/:eventId/retry",
    requireAuth,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const webhook = await storage.getZoomWebhookEvent(req.params.eventId);
        if (!webhook) {
          return res.status(404).json({ error: "Zoom notification not found." });
        }
        if (webhook.status !== "failed") {
          return res.status(409).json({ error: "Only failed imports can be retried." });
        }
        void processZoomRecordingWebhook(webhook.eventId, dependencies);
        return res.status(202).json({
          accepted: true,
          eventId: webhook.eventId,
          message: "Zoom recording import retry started.",
        });
      } catch (error) {
        console.error(
          "Failed to retry Zoom recording import:",
          error instanceof Error ? error.message : "unknown error",
        );
        return res.status(500).json({ error: "Zoom recording import could not be retried." });
      }
    },
  );

  // Never return provider IDs or storage keys for a restricted video. A
  // learner can still receive the resource metadata, but playback must go
  // through the authorization endpoint below.
  const toResourceResponse = (resource: any, isAdminUser: boolean) => {
    if (isAdminUser || !resourceIsRestricted(resource)) return resource;
    return {
      ...resource,
      fileUrl: null,
      youtubeVideoId: null,
      youtubeUrl: null,
      videoStorageKey: null,
    };
  };

  // Database mutations are authoritative. Object cleanup is best-effort so a
  // storage outage cannot turn a successful resource change into an error or
  // expose provider details to a learner.
  const cleanupPrivateVideo = async (resourceId: string, storageKey: string | null | undefined) => {
    if (!storageKey) return;
    try {
      // The resource mutation has already succeeded. Release the ledger row
      // before attempting provider cleanup so a transient outage leaves a
      // durable, retryable candidate instead of an apparently attached one.
      await storage.releasePrivateVideoUpload(storageKey, resourceId);
    } catch (error) {
      (dependencies.logError ?? console.error)(
        `Failed to record private video cleanup for resource ${resourceId}.`,
        error instanceof Error ? error.message : "unknown error",
      );
    }
    try {
      const attachedResource = await storage.getResourceByVideoStorageKey(storageKey);
      if (attachedResource && attachedResource.id !== resourceId) {
        return;
      }
      const deletePrivateVideo = dependencies.deletePrivateVideo ?? (async (key: string) => {
        const { isR2Configured, deletePrivateVideo: deleteFromR2 } = await import("./r2-storage");
        if (isR2Configured()) {
          await deleteFromR2(key);
        } else {
          await deleteObjectStorageFile(key);
        }
      });
      await deletePrivateVideo(storageKey);
      await storage.removePrivateVideoUpload(storageKey);
    } catch (error) {
      (dependencies.logError ?? console.error)(
        `Failed to clean up private video for resource ${resourceId}.`,
        error instanceof Error ? error.message : "unknown error",
      );
    }
  };

  // Uploads are tracked before they are returned to the admin UI. Cleanup is
  // deliberately best-effort: the database/resource association is
  // authoritative, and a storage outage must only leave an object for a
  // later sweep rather than break an unrelated request.
  let privateVideoCleanupInProgress = false;
  const reconcilePrivateVideoObjects = async () => {
    if (privateVideoCleanupInProgress) return;
    privateVideoCleanupInProgress = true;
    const deletedKeys: string[] = [];
    const failedKeys: string[] = [];
    const untrackedKeys: string[] = [];
    let scanned = 0;
    try {
      const cutoff = new Date(Date.now() - PRIVATE_VIDEO_UPLOAD_RETENTION_MS);
      if (!dependencies.listPrivateVideoFiles) {
        const { isR2Configured } = await import("./r2-storage");
        const objectStorageAvailable = isObjectStorageConfigured()
          ? await checkObjectStorageAvailable()
          : false;
        if (!isR2Configured() && !objectStorageAvailable) {
          return { scanned: 0, deletedKeys, failedKeys, untrackedKeys };
        }
      }
      const [privateVideoKeys, uploads] = await Promise.all([
        dependencies.listPrivateVideoFiles
          ? dependencies.listPrivateVideoFiles()
          : (async () => {
              const { isR2Configured } = await import("./r2-storage");
              if (!isR2Configured()) return listObjectStoragePrivateVideoFiles();
              const { listPrivateVideoFiles } = await import("./r2-storage");
              return listPrivateVideoFiles();
            })(),
        storage.getPrivateVideoUploads(),
      ]);
      const uploadsByKey = new Map(uploads.map(upload => [upload.storageKey, upload]));
      const candidateKeys = privateVideoKeys.filter(key => isPrivateVideoStorageKey(key));
      scanned = candidateKeys.length;
      for (const storageKey of candidateKeys) {
        const attachedResource = await storage.getResourceByVideoStorageKey(storageKey);
        if (attachedResource) {
          // Recover from a process interruption between saving the resource
          // and claiming the upload ledger row.
          await storage.claimPrivateVideoUpload(storageKey, attachedResource.id);
          continue;
        }
        const upload = uploadsByKey.get(storageKey);
        if (!upload) {
          // The object is inside our generated namespace but has no ledger
          // record. Report it without deleting it; an operator can investigate
          // it without allowing a malformed/unrelated key to be removed.
          untrackedKeys.push(storageKey);
          continue;
        }
        // A stale resource claim also means cleanup was requested: it covers
        // older failures that happened before cleanup_requested_at existed or
        // while recording the cleanup request was unavailable.
        const hasStaleResourceClaim = upload.resourceId !== null;
        if (!upload.cleanupRequestedAt && !hasStaleResourceClaim && upload.createdAt >= cutoff) {
          continue;
        }
        try {
          await storage.markPrivateVideoCleanupAttempt(storageKey);
          const deletePrivateVideo = dependencies.deletePrivateVideo ?? (async (key: string) => {
            const { isR2Configured, deletePrivateVideo: deleteFromStorage } = await import("./r2-storage");
            if (isR2Configured()) {
              await deleteFromStorage(key);
            } else {
              await deleteObjectStorageFile(key);
            }
          });
          await deletePrivateVideo(storageKey);
          await storage.removePrivateVideoUpload(storageKey);
          deletedKeys.push(storageKey);
        } catch (error) {
          try {
            await storage.markPrivateVideoCleanupFailure(storageKey);
          } catch (statusError) {
            (dependencies.logError ?? console.error)(
              `Failed to record private video cleanup status for upload ${upload.id}.`,
              statusError instanceof Error ? statusError.message : "unknown error",
            );
          }
          failedKeys.push(storageKey);
          (dependencies.logError ?? console.error)(
            `Failed to reconcile private video upload ${upload.id}.`,
            error instanceof Error ? error.message : "unknown error",
          );
        }
      }
    } catch (error) {
      (dependencies.logError ?? console.error)(
        "Failed to reconcile private video objects.",
        error instanceof Error ? error.message : "unknown error",
      );
    } finally {
      privateVideoCleanupInProgress = false;
    }
    return {
      scanned,
      deletedKeys,
      failedKeys,
      untrackedKeys,
    };
  };

  const getPrivateVideoCleanupStatus = async () => {
    const uploads = await storage.getPrivateVideoUploads();
    const trackedKeys = new Set(uploads.map(upload => upload.storageKey));
    let untracked = 0;
    let storageAvailable = true;

    if (dependencies.listPrivateVideoFiles) {
      const keys = await dependencies.listPrivateVideoFiles();
      for (const key of keys.filter(key => isPrivateVideoStorageKey(key))) {
        if (trackedKeys.has(key)) continue;
        const attachedResource = await storage.getResourceByVideoStorageKey(key);
        if (!attachedResource) untracked += 1;
      }
    } else {
      const { isR2Configured, listPrivateVideoFiles } = await import("./r2-storage");
      if (isR2Configured()) {
        const keys = await listPrivateVideoFiles();
        for (const key of keys.filter(key => isPrivateVideoStorageKey(key))) {
          if (trackedKeys.has(key)) continue;
          const attachedResource = await storage.getResourceByVideoStorageKey(key);
          if (!attachedResource) untracked += 1;
        }
      } else if (isObjectStorageConfigured() && await checkObjectStorageAvailable()) {
        const keys = await listObjectStoragePrivateVideoFiles();
        for (const key of keys.filter(key => isPrivateVideoStorageKey(key))) {
          if (trackedKeys.has(key)) continue;
          const attachedResource = await storage.getResourceByVideoStorageKey(key);
          if (!attachedResource) untracked += 1;
        }
      } else if (isObjectStorageConfigured()) {
        storageAvailable = false;
      }
    }

    const cutoff = new Date(Date.now() - PRIVATE_VIDEO_UPLOAD_RETENTION_MS);
    const activeUploads = uploads.filter(upload => upload.cleanupStatus !== "removed");
    const pending = activeUploads.filter(upload =>
      !upload.resourceId && (
        upload.cleanupStatus !== "failed" && (
          upload.cleanupStatus === "pending" ||
          Boolean(upload.cleanupRequestedAt) ||
          upload.createdAt < cutoff
        )
      ),
    ).length;
    const failed = uploads.filter(upload => upload.cleanupStatus === "failed").length;
    const removed = uploads.filter(upload => upload.cleanupStatus === "removed").length;
    const totalAttempts = uploads.reduce(
      (total, upload) => total + (upload.cleanupAttemptCount || 0),
      0,
    );
    const lastAttemptAt = uploads
      .map(upload => upload.lastCleanupAttemptAt)
      .filter((attempt): attempt is Date => Boolean(attempt))
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;

    return {
      counts: { pending, failed, untracked, removed },
      storageAvailable,
      totalAttempts,
      lastAttemptAt,
    };
  };

  const sendPrivateVideoCleanupStatus = async (_req: Request, res: Response) => {
    try {
      res.json(await getPrivateVideoCleanupStatus());
    } catch (error) {
      (dependencies.logError ?? console.error)(
        "Failed to load private video cleanup status.",
        error instanceof Error ? error.message : "unknown error",
      );
      res.status(500).json({ error: "Private video cleanup status is unavailable." });
    }
  };

  app.get(
    "/api/admin/resources/private-videos/status",
    requireAuth,
    requireAdminRole,
    sendPrivateVideoCleanupStatus,
  );
  // Keep status beside the existing reconciliation action for operators and
  // clients that already know that route.
  app.get(
    "/api/admin/resources/private-videos/reconcile",
    requireAuth,
    requireAdminRole,
    sendPrivateVideoCleanupStatus,
  );

  void reconcilePrivateVideoObjects();
  const privateVideoCleanupTimer = setInterval(
    () => void reconcilePrivateVideoObjects(),
    PRIVATE_VIDEO_CLEANUP_INTERVAL_MS,
  );
  privateVideoCleanupTimer.unref();

  app.post(
    "/api/admin/resources/private-videos/reconcile",
    requireAuth,
    requireAdminRole,
    async (_req: Request, res: Response) => {
      const result = await reconcilePrivateVideoObjects();
      res.json(result ?? {
        scanned: 0,
        deletedKeys: [],
        failedKeys: [],
        untrackedKeys: [],
      });
    },
  );

  const claimPrivateVideoUpload = async (storageKey: string | null | undefined, resourceId: string) => {
    if (!storageKey) return;
    try {
      await storage.claimPrivateVideoUpload(storageKey, resourceId);
    } catch (error) {
      console.error(`Failed to claim private video upload for resource ${resourceId}:`, error);
    }
  };

  // Keep local development usable without making the fallback signing key
  // predictable. In production SESSION_SECRET is supplied by the environment.
  const playbackSigningSecret =
    process.env.SESSION_SECRET || randomUUID();
  const playbackSecret = () => playbackSigningSecret;
  const playbackTokenTtlSeconds = 15 * 60;

  const getPlaybackAuthorization = async (req: Request, resource: any) => {
    const sessionUserId = req.session?.userId || null;
    const sessionUser = sessionUserId
      ? await storage.getUser(sessionUserId)
      : undefined;
    const authorization = authorizePlayback(resource, sessionUserId, sessionUser);
    if (authorization.status !== 200 || !sessionUserId || isAdminSession(req)) {
      return authorization;
    }
    const courses = await storage.getCoursesForResource(resource.id);
    if (courses.length > 0 && !(await Promise.all(courses.map((course) => canAccessCourse(req, course)))).some(Boolean)) {
      return { status: 403 as const, userId: sessionUserId };
    }
    return authorization;
  };

  app.get("/api/users", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      if (req.params.id !== req.session.userId && !isAdminSession(req)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(sanitizeUser(user));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/users/role/:role", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsersByRole(req.params.role);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users by role" });
    }
  });

  app.post("/api/users", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data);
      res.status(201).json(sanitizeUser(user));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Admin-only endpoint: create a team member (mentor/facilitator/admin) with role set immediately
  // and send a welcome email containing login credentials.
  app.post("/api/admin/users", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        role: z.enum(["community_member", "participant", "mentor", "facilitator", "admin", "superadmin"]),
        sendLoginEmail: z.boolean().optional(),
      });
      const { email, password, firstName, lastName, role, sendLoginEmail } = schema.parse(req.body);

      const existing = await storage.getUserByEmail(email.toLowerCase().trim());
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const teamRoles = ["mentor", "facilitator", "admin", "superadmin"];
      const user = await createUserWithPassword(
        email.toLowerCase().trim(),
        password,
        firstName,
        lastName,
        role,
        teamRoles.includes(role) // mustChangePassword = true for team members
      );

      // Send welcome email with credentials when requested (fire-and-forget)
      if (sendLoginEmail) {
        import("./email").then(({ sendTeamWelcomeEmail }) => {
          sendTeamWelcomeEmail(user.email, firstName, role, password).catch(err => {
            console.error("Welcome email failed:", err);
          });
        }).catch(err => console.error("Failed to import email module:", err));
      }

      const { passwordHash, ...safeUser } = user;
      res.status(201).json({ user: safeUser });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.post("/api/users/:id/reset-password", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { hashPassword } = await import("./auth");
      const DEFAULT_PASSWORD = "Admin123!";
      const passwordHash = await hashPassword(DEFAULT_PASSWORD);
      // Always enforce password change on next login when an admin resets a password
      const user = await storage.updateUser(req.params.id, { passwordHash, mustChangePassword: true });
      if (!user) return res.status(404).json({ error: "User not found" });
      // Send notification email so the user knows to expect the forced change
      try {
        const { sendAdminPasswordResetNotificationEmail } = await import("./email");
        const baseUrl = getAppBaseUrl();
        await sendAdminPasswordResetNotificationEmail(user.email, user.firstName, `${baseUrl}/login`);
      } catch (emailErr) {
        console.error("Failed to send password reset notification email:", emailErr);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireSuperAdminRole, async (req: Request, res: Response) => {
    try {
      if (req.params.id === req.session.userId) {
        return res.status(400).json({ error: "You cannot delete your own account" });
      }
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      await storage.deleteUser(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (error) {
      console.error("DELETE /api/users/:id error:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.get("/api/profiles/:userId", async (req: Request, res: Response) => {
    try {
      const profile = await storage.getProfile(req.params.userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      const callerIsOwner = req.session?.userId === req.params.userId;
      if (!callerIsOwner && !isAdminSession(req)) {
        const { meetingPlatformPreference, meetingLink, ...publicProfile } = profile;
        return res.json(publicProfile);
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/profiles", async (req: Request, res: Response) => {
    try {
      const data = insertProfileSchema.parse(req.body);
      const profile = await storage.createProfile(data);
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  app.patch("/api/profiles/:userId", async (req: Request, res: Response) => {
    try {
      const profile = await storage.updateProfile(req.params.userId, req.body);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.get("/api/mentors", async (req: Request, res: Response) => {
    try {
      const mentors = await storage.getAllMentors();
      res.json(mentors.map(({ passwordHash, passwordResetToken, passwordResetExpiresAt, mustChangePassword, ...m }) => m));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mentors" });
    }
  });

  app.get("/api/mentors/:userId", async (req: Request, res: Response) => {
    try {
      const mentorProfile = await storage.getMentorProfile(req.params.userId);
      if (!mentorProfile) return res.status(404).json({ error: "Mentor profile not found" });
      const user = await storage.getUser(req.params.userId);
      const profile = await storage.getProfile(req.params.userId);
      const safeUser = user ? sanitizeUser(user) : {};
      const callerIsOwner = req.session?.userId === req.params.userId;
      const safeProfile = profile && !callerIsOwner && !isAdminSession(req)
        ? (({ meetingPlatformPreference, meetingLink, ...p }) => p)(profile)
        : profile;
      res.json({ ...safeUser, mentorProfile, profile: safeProfile });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mentor" });
    }
  });

  app.post("/api/mentors", async (req: Request, res: Response) => {
    try {
      const data = insertMentorProfileSchema.parse(req.body);
      const mentorProfile = await storage.createMentorProfile(data);
      res.status(201).json(mentorProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create mentor profile" });
    }
  });

  app.patch("/api/mentors/:userId", async (req: Request, res: Response) => {
    try {
      const mentorProfile = await storage.updateMentorProfile(req.params.userId, req.body);
      if (!mentorProfile) return res.status(404).json({ error: "Mentor profile not found" });
      res.json(mentorProfile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update mentor profile" });
    }
  });

  app.get("/api/facilitators", async (req: Request, res: Response) => {
    try {
      const facilitators = await storage.getAllFacilitators();
      res.json(facilitators.map(({ passwordHash, passwordResetToken, passwordResetExpiresAt, mustChangePassword, ...f }) => f));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch facilitators" });
    }
  });

  app.get("/api/facilitators/:userId", async (req: Request, res: Response) => {
    try {
      const facilitatorProfile = await storage.getFacilitatorProfile(req.params.userId);
      if (!facilitatorProfile) return res.status(404).json({ error: "Facilitator profile not found" });
      const user = await storage.getUser(req.params.userId);
      const profile = await storage.getProfile(req.params.userId);
      const safeUser = user ? sanitizeUser(user) : {};
      const callerIsOwner = req.session?.userId === req.params.userId;
      const safeProfile = profile && !callerIsOwner && !isAdminSession(req)
        ? (({ meetingPlatformPreference, meetingLink, ...p }) => p)(profile)
        : profile;
      res.json({ ...safeUser, facilitatorProfile, profile: safeProfile });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch facilitator" });
    }
  });

  app.post("/api/facilitators", async (req: Request, res: Response) => {
    try {
      const data = insertFacilitatorProfileSchema.parse(req.body);
      const facilitatorProfile = await storage.createFacilitatorProfile(data);
      res.status(201).json(facilitatorProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create facilitator profile" });
    }
  });

  app.patch("/api/facilitators/:userId", async (req: Request, res: Response) => {
    try {
      const facilitatorProfile = await storage.updateFacilitatorProfile(req.params.userId, req.body);
      if (!facilitatorProfile) return res.status(404).json({ error: "Facilitator profile not found" });
      res.json(facilitatorProfile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update facilitator profile" });
    }
  });

  const getPublishedLessonIssue = async (lesson: any): Promise<string | null> => {
    if (lesson.lessonType === "video") {
      if (lesson.resourceId) {
        const resource = await storage.getResource(lesson.resourceId);
        if (!resource) return "The selected video resource no longer exists.";
        if (resource.resourceType !== "video") return "A video lesson must use a video resource.";
        if (resource.status !== "published") return "Publish the selected video resource before publishing this lesson.";
        if (resource.videoSource === "upload" && !resource.videoStorageKey) return "The selected private video is not ready for playback.";
        if (resource.videoSource === "youtube" && !resource.youtubeVideoId) return "The selected YouTube video is missing its video ID.";
        return null;
      }
      const videoId = lesson.videoId || (lesson.videoUrl ? parseYouTubeVideoId(lesson.videoUrl) : null);
      if (lesson.videoSource !== "youtube" || !videoId) {
        return "Add a valid YouTube URL/ID or attach a ready video resource before publishing.";
      }
      return null;
    }

    if (lesson.lessonType === "downloadable") {
      if (lesson.resourceId) {
        const resource = await storage.getResource(lesson.resourceId);
        if (!resource) return "The selected downloadable resource no longer exists.";
        if (resource.resourceType === "video") return "A downloadable lesson cannot use a video resource.";
        if (resource.status !== "published") return "Publish the selected resource before publishing this lesson.";
        if (!resource.fileUrl) return "The selected resource does not have a downloadable file.";
        return null;
      }
      return lesson.downloadableUrl ? null : "Attach a downloadable resource or provide a file URL before publishing.";
    }

    if (lesson.lessonType === "text" && !lesson.content?.trim()) {
      return "Add written lesson content before publishing.";
    }
    return null;
  };

  const validateCourseForPublication = async (courseId: string): Promise<string | null> => {
    const courseModules = await storage.getModulesByCourse(courseId);
    if (courseModules.length === 0) return "Add at least one module before publishing this course.";
    for (const module of courseModules) {
      const moduleLessons = await storage.getLessonsByModule(module.id);
      if (moduleLessons.length === 0) return `"${module.title}" needs at least one lesson before the course can be published.`;
      for (const lesson of moduleLessons) {
        if (lesson.status !== "published") return `Publish or remove "${lesson.title}" before publishing this course.`;
        const issue = await getPublishedLessonIssue(lesson);
        if (issue) return `"${lesson.title}": ${issue}`;
      }
    }
    return null;
  };

  const getCourseResponse = async (course: any, admin: boolean, userRole: string | null) => {
    const courseModules = await storage.getModulesByCourse(course.id);
    let calculatedDurationMinutes = 0;
    let lessonCount = 0;
    const modulesWithLessons = await Promise.all(courseModules.map(async (module) => {
      const allLessons = await storage.getLessonsByModule(module.id);
      const visibleLessons = admin ? allLessons : allLessons.filter((lesson) => lesson.status === "published");
      const lessonsWithResources = await Promise.all(visibleLessons.map(async (lesson) => {
        const resource = lesson.resourceId ? await storage.getResource(lesson.resourceId) : null;
        const canUseResource = !resource || (
          resource.status === "published" &&
          canAccessVisibility(resource.visibility, admin ? "admin" : userRole)
        );
        return {
          ...lesson,
          resource: resource && canUseResource ? toResourceResponse(resource, admin) : null,
          contentAvailable: Boolean(!lesson.resourceId || canUseResource),
        };
      }));
      lessonCount += lessonsWithResources.length;
      calculatedDurationMinutes += lessonsWithResources.reduce(
        (total, lesson) => total + (lesson.durationMinutes || Math.ceil((lesson.videoDurationSeconds || 0) / 60)),
        0,
      );
      return { ...module, lessons: lessonsWithResources };
    }));
    return {
      ...course,
      durationMinutes: course.durationOverrideMinutes ?? calculatedDurationMinutes,
      calculatedDurationMinutes,
      moduleCount: modulesWithLessons.length,
      lessonCount,
      modules: modulesWithLessons,
      ...(admin ? { cohortIds: await storage.getCourseCohortIds(course.id) } : {}),
    };
  };

  const getCourseForLesson = async (lesson: any) => {
    const allCourses = await storage.getAllCourses();
    for (const course of allCourses) {
      const courseModules = await storage.getModulesByCourse(course.id);
      if (courseModules.some((module) => module.id === lesson.moduleId)) return course;
    }
    return undefined;
  };

  const canAccessCourse = async (req: Request, course: any): Promise<boolean> => {
    if (isAdminSession(req) || course.audience !== "selected") return true;
    if (!req.session.userId) return false;
    const activeCohort = await storage.getActiveCohortForUser(req.session.userId);
    return Boolean(activeCohort && await storage.isCourseAssignedToCohort(course.id, activeCohort.id));
  };

  const canAccessResource = async (req: Request, resource: any): Promise<boolean> => {
    if (isAdminSession(req)) return true;
    const courses = await storage.getCoursesForResource(resource.id);
    return courses.length === 0 || (await Promise.all(courses.map((course) => canAccessCourse(req, course)))).some(Boolean);
  };

  const getAcceptedCohortParticipants = async (cohortId: string) => {
    const acceptedApplications = (await storage.getApplicationsByStatus("accepted"))
      .filter((application) => application.cohortId === cohortId);
    const seen = new Set<string>();
    const participants = [];
    for (const application of acceptedApplications) {
      const user = await storage.getUserByEmail(application.email);
      if (!user || seen.has(user.id) || !user.isActive) continue;
      seen.add(user.id);
      participants.push({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        applicationId: application.id,
      });
    }
    return participants;
  };

  const getLearningPodResponse = async (pod: any, req: Request, includeAllSubmissions = false) => {
    const cohort = await storage.getCohort(pod.cohortId);
    const mentor = await storage.getUser(pod.mentorId);
    const memberRows = await storage.getLearningPodMembers(pod.id);
    const members = (await Promise.all(memberRows.map(async (member) => {
      const user = await storage.getUser(member.userId);
      return user ? sanitizeUser(user) : null;
    }))).filter(Boolean);
    const isPodMentor = req.session.userId === pod.mentorId;
    const assignments = (await storage.getLearningPodAssignments(pod.id))
      .filter((assignment) => isAdminSession(req) || isPodMentor || assignment.status === "published");
    const assignmentsWithSubmissions = await Promise.all(assignments.map(async (assignment) => {
      const allSubmissions = await storage.getLearningPodSubmissions(assignment.id, pod.id);
      const submissions = includeAllSubmissions || isAdminSession(req) || isPodMentor || assignment.workType === "group"
        ? allSubmissions
        : allSubmissions.filter((submission) => submission.submitterId === req.session.userId);
      return { ...assignment, submissions };
    }));
    return {
      ...pod,
      cohort: cohort ? { id: cohort.id, name: cohort.name, displayName: cohort.displayName } : null,
      mentor: mentor ? sanitizeUser(mentor) : null,
      members,
      assignments: assignmentsWithSubmissions,
    };
  };

  const canAccessLearningPod = async (req: Request, pod: any) => {
    if (isAdminSession(req)) return true;
    if (pod.status !== "active") return false;
    if (pod.mentorId === req.session.userId) return true;
    const activeCohort = req.session.userId
      ? await storage.getActiveCohortForUser(req.session.userId)
      : undefined;
    if (!activeCohort || activeCohort.id !== pod.cohortId) return false;
    const members = await storage.getLearningPodMembers(pod.id);
    return members.some((member) => member.userId === req.session.userId);
  };

  const validateLearningPodMentor = async (mentorId: string) => {
    const mentor = await storage.getUser(mentorId);
    return mentor && mentor.isActive && mentor.role === "mentor" ? mentor : undefined;
  };

  const getActivePodMemberIdsForCohort = async (cohortId: string, excludingPodId?: string) => {
    const pods = (await storage.getLearningPodsByCohort(cohortId))
      .filter((pod) => pod.id !== excludingPodId);
    const assigned = new Set<string>();
    for (const pod of pods) {
      const members = await storage.getLearningPodMembers(pod.id);
      members.forEach((member) => assigned.add(member.userId));
    }
    return assigned;
  };

  const validateCourseCohorts = async (cohortIds: string[]): Promise<string | null> => {
    const uniqueCohortIds = Array.from(new Set(cohortIds));
    const cohorts = await Promise.all(uniqueCohortIds.map((cohortId) => storage.getCohort(cohortId)));
    const missing = uniqueCohortIds.filter((_, index) => !cohorts[index]);
    return missing.length > 0 ? "One or more selected cohorts could not be found." : null;
  };

  app.get("/api/courses", requireAuth, async (req: Request, res: Response) => {
    try {
      const admin = isAdminSession(req);
      const allCourses = admin ? await storage.getAllCourses() : await storage.getPublishedCourses();
      const visibleCourses = admin
        ? allCourses
        : (await Promise.all(allCourses.map(async (course) => (
          await canAccessCourse(req, course) ? course : null
        )))).filter((course): course is typeof allCourses[number] => Boolean(course));
      res.json(await Promise.all(visibleCourses.map((course) => getCourseResponse(course, admin, req.session.userRole || null))));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) return res.status(404).json({ error: "Course not found" });
      const admin = isAdminSession(req);
      if (!admin && (course.status !== "published" || !(await canAccessCourse(req, course)))) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(await getCourseResponse(course, admin, req.session.userRole || null));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const assignment = courseAssignmentSchema.parse(req.body);
      const data = insertCourseSchema.parse(req.body);
      if (data.status === "published") {
        return res.status(400).json({ error: "Create the course as a draft, add its curriculum, then publish it." });
      }
      const cohortError = await validateCourseCohorts(assignment.cohortIds);
      if (cohortError) return res.status(400).json({ error: cohortError });
      const course = await storage.createCourse(data);
      await storage.setCourseCohorts(course.id, assignment.audience === "selected" ? Array.from(new Set(assignment.cohortIds)) : []);
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  app.patch("/api/courses/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const hasAssignmentFields = Object.prototype.hasOwnProperty.call(req.body, "audience")
        || Object.prototype.hasOwnProperty.call(req.body, "cohortIds");
      const assignment = hasAssignmentFields ? courseAssignmentSchema.parse(req.body) : null;
      const data = insertCourseSchema.partial().parse(req.body);
      if (assignment) {
        const cohortError = await validateCourseCohorts(assignment.cohortIds);
        if (cohortError) return res.status(400).json({ error: cohortError });
      }
      if (data.status === "published") {
        const issue = await validateCourseForPublication(req.params.id);
        if (issue) return res.status(400).json({ error: issue });
      }
      const course = await storage.updateCourse(req.params.id, {
        ...data,
        ...(data.status === "published" ? { publishedAt: new Date() } : {}),
      });
      if (!course) return res.status(404).json({ error: "Course not found" });
      if (assignment) {
        await storage.setCourseCohorts(course.id, assignment.audience === "selected" ? Array.from(new Set(assignment.cohortIds)) : []);
      }
      res.json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      await storage.deleteCourse(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete course" });
    }
  });

  app.get("/api/courses/:courseId/modules", requireAuth, async (req: Request, res: Response) => {
    try {
      const course = await storage.getCourse(req.params.courseId);
      if (!course || (!isAdminSession(req) && (course.status !== "published" || !(await canAccessCourse(req, course))))) {
        return res.status(404).json({ error: "Course not found" });
      }
      const response = await getCourseResponse(course, isAdminSession(req), req.session.userRole || null);
      res.json(response.modules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });

  app.post("/api/modules", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const data = insertModuleSchema.parse(req.body);
      const module = await storage.createModule(data);
      res.status(201).json(module);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create module" });
    }
  });

  app.patch("/api/modules/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const module = await storage.updateModule(req.params.id, req.body);
      if (!module) return res.status(404).json({ error: "Module not found" });
      res.json(module);
    } catch (error) {
      res.status(500).json({ error: "Failed to update module" });
    }
  });

  app.delete("/api/modules/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      await storage.deleteModule(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete module" });
    }
  });

  app.get("/api/modules/:moduleId/lessons", requireAuth, async (req: Request, res: Response) => {
    try {
      const moduleLessons = await storage.getLessonsByModule(req.params.moduleId);
      if (isAdminSession(req)) return res.json(moduleLessons);
      const allCourses = await storage.getAllCourses();
      let parentCourse: Awaited<ReturnType<typeof storage.getCourse>> | undefined;
      for (const candidate of allCourses) {
        const candidateModules = await storage.getModulesByCourse(candidate.id);
        if (candidateModules.some((module) => module.id === req.params.moduleId)) {
          parentCourse = candidate;
          break;
        }
      }
      if (!parentCourse || parentCourse.status !== "published") {
        return res.status(404).json({ error: "Module not found" });
      }
      if (!(await canAccessCourse(req, parentCourse))) {
        return res.status(404).json({ error: "Module not found" });
      }
      res.json(moduleLessons.filter((lesson) => lesson.status === "published"));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  app.get("/api/lessons/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const lesson = await storage.getLesson(req.params.id);
      if (!lesson) return res.status(404).json({ error: "Lesson not found" });
      const course = await getCourseForLesson(lesson);
      if (!course || (!isAdminSession(req) && (course.status !== "published" || lesson.status !== "published" || !(await canAccessCourse(req, course))))) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  app.post("/api/lessons", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const data = insertLessonSchema.parse(req.body);
      if (data.status === "published") {
        const issue = await getPublishedLessonIssue(data);
        if (issue) return res.status(400).json({ error: issue });
      }
      const lesson = await storage.createLesson(data);
      res.status(201).json(lesson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create lesson" });
    }
  });

  app.patch("/api/lessons/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const existing = await storage.getLesson(req.params.id);
      if (!existing) return res.status(404).json({ error: "Lesson not found" });
      const merged = insertLessonSchema.parse({ ...existing, ...req.body });
      if (merged.status === "published") {
        const issue = await getPublishedLessonIssue(merged);
        if (issue) return res.status(400).json({ error: issue });
      }
      const lesson = await storage.updateLesson(req.params.id, merged);
      if (!lesson) return res.status(404).json({ error: "Lesson not found" });
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to update lesson" });
    }
  });

  app.delete("/api/lessons/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      await storage.deleteLesson(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lesson" });
    }
  });

  app.get("/api/enrollments/user/:userId", requireAuth, async (req: Request, res: Response) => {
    try {
      if (req.params.userId !== req.session.userId && !isAdminSession(req)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const admin = isAdminSession(req);
      const userEnrollments = await storage.getEnrollmentsByUser(req.params.userId);
      const enrollmentsWithCourses = (await Promise.all(
        userEnrollments.map(async (enrollment) => {
          const course = await storage.getCourse(enrollment.courseId);
          if (!course || (!admin && (course.status !== "published" || !(await canAccessCourse(req, course))))) {
            return null;
          }
          return { ...enrollment, course };
        })
      )).filter((enrollment): enrollment is NonNullable<typeof enrollment> => Boolean(enrollment));
      res.json(enrollmentsWithCourses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  app.get("/api/enrollments/course/:courseId", async (req: Request, res: Response) => {
    try {
      const courseEnrollments = await storage.getEnrollmentsByCourse(req.params.courseId);
      res.json(courseEnrollments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/enrollments", requireAuth, async (req: Request, res: Response) => {
    try {
      const data = insertEnrollmentSchema.parse(req.body);
      if (data.userId !== req.session.userId && !isAdminSession(req)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const course = await storage.getCourse(data.courseId);
      if (!course || (!isAdminSession(req) && (
        course.status !== "published" || !(await canAccessCourse(req, course))
      ))) {
        return res.status(404).json({ error: "Course not found" });
      }
      const existing = await storage.getEnrollment(data.userId, data.courseId);
      if (existing) {
        return res.status(400).json({ error: "Already enrolled in this course" });
      }
      const enrollment = await storage.createEnrollment(data);
      res.status(201).json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create enrollment" });
    }
  });

  app.patch("/api/enrollments/:id", async (req: Request, res: Response) => {
    try {
      const enrollment = await storage.updateEnrollment(req.params.id, req.body);
      if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update enrollment" });
    }
  });

  app.get("/api/progress/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const progress = await storage.getLessonProgressByUser(req.session.userId!);
      if (isAdminSession(req)) return res.json(progress);
      const visibleProgress = (await Promise.all(progress.map(async (entry) => {
        const lesson = await storage.getLesson(entry.lessonId);
        const course = lesson ? await getCourseForLesson(lesson) : undefined;
        return course && await canAccessCourse(req, course) ? entry : null;
      }))).filter((entry): entry is typeof progress[number] => Boolean(entry));
      res.json(visibleProgress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.get("/api/progress/user/:userId", requireAuth, async (req: Request, res: Response) => {
    try {
      if (req.params.userId !== req.session.userId && !isAdminSession(req)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const progress = await storage.getLessonProgressByUser(req.params.userId);
      if (isAdminSession(req)) return res.json(progress);
      const visibleProgress = (await Promise.all(progress.map(async (entry) => {
        const lesson = await storage.getLesson(entry.lessonId);
        const course = lesson ? await getCourseForLesson(lesson) : undefined;
        return course && await canAccessCourse(req, course) ? entry : null;
      }))).filter((entry): entry is typeof progress[number] => Boolean(entry));
      res.json(visibleProgress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.post("/api/progress", requireAuth, async (req: Request, res: Response) => {
    try {
      const data = z.object({
        lessonId: z.string().min(1),
        status: z.enum(["not_started", "in_progress", "completed"]).optional(),
        videoWatchedSeconds: z.number().int().min(0).optional(),
      }).parse(req.body);
      const lesson = await storage.getLesson(data.lessonId);
      if (!lesson) return res.status(404).json({ error: "Lesson not found" });
      const course = await getCourseForLesson(lesson);
      if (!course || course.status !== "published" || lesson.status !== "published" || !(await canAccessCourse(req, course))) {
        return res.status(404).json({ error: "Lesson not available" });
      }
      const progressData = {
        userId: req.session.userId!,
        lessonId: data.lessonId,
        status: data.status || "in_progress",
        videoWatchedSeconds: data.videoWatchedSeconds,
        lastAccessedAt: new Date(),
        completedAt: data.status === "completed" ? new Date() : undefined,
      };
      const existing = await storage.getLessonProgress(progressData.userId, data.lessonId);
      if (existing) {
        const updated = await storage.updateLessonProgress(existing.id, progressData);
        return res.json(updated);
      }
      const progress = await storage.createLessonProgress(progressData);
      res.status(201).json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  // --- Learning Pods ---
  // Admin routes intentionally sit before the parameterized route below so
  // `/eligible` cannot be interpreted as a pod id.
  app.get("/api/admin/learning-pods", requireAuth, requireAdminRole, async (_req: Request, res: Response) => {
    try {
      const pods = await storage.getAllLearningPods();
      const responses = await Promise.all(pods.map((pod) => getLearningPodResponse(pod, _req, true)));
      res.json(responses);
    } catch (error) {
      console.error("Failed to fetch learning pods:", error);
      res.status(500).json({ error: "Failed to fetch learning pods" });
    }
  });

  app.get("/api/admin/learning-pods/eligible", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const cohortId = z.string().min(1).parse(req.query.cohortId);
      const cohort = await storage.getCohort(cohortId);
      if (!cohort) return res.status(404).json({ error: "Cohort not found" });
      res.json(await getAcceptedCohortParticipants(cohortId));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "A cohort is required" });
      res.status(500).json({ error: "Failed to fetch eligible participants" });
    }
  });

  app.post("/api/admin/learning-pods", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const data = learningPodPayloadSchema.parse(req.body);
      const cohort = await storage.getCohort(data.cohortId);
      if (!cohort) return res.status(404).json({ error: "Cohort not found" });
      if (!await validateLearningPodMentor(data.mentorId)) {
        return res.status(400).json({ error: "The selected mentor is not available" });
      }
      const members = Array.isArray(req.body.userIds) ? z.array(z.string()).parse(req.body.userIds) : [];
      const eligibleIds = new Set((await getAcceptedCohortParticipants(data.cohortId)).map((participant) => participant.id));
      if (members.some((userId) => !eligibleIds.has(userId))) {
        return res.status(400).json({ error: "Every pod member must be an accepted participant in the selected cohort" });
      }
      // Keep the fast validation for a friendly response in the common case.
      // The storage transaction below repeats this check while holding the
      // cohort lock, which is the authority when two requests race.
      const alreadyAssigned = await getActivePodMemberIdsForCohort(data.cohortId);
      if (members.some((userId) => alreadyAssigned.has(userId))) {
        return res.status(400).json({ error: "A participant can only belong to one active pod in a cohort" });
      }
      const pod = await storage.createLearningPodWithMembers(data, members);
      res.status(201).json(await getLearningPodResponse(pod, req, true));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      if (error instanceof LearningPodMembershipConflictError) return res.status(400).json({ error: error.message });
      res.status(500).json({ error: "Failed to create learning pod" });
    }
  });

  app.post("/api/admin/learning-pods/auto-distribute", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const data = learningPodAutoDistributeSchema.parse(req.body);
      const cohort = await storage.getCohort(data.cohortId);
      if (!cohort) return res.status(404).json({ error: "Cohort not found" });
      for (const mentorId of data.mentorIds) {
        if (!await validateLearningPodMentor(mentorId)) {
          return res.status(400).json({ error: "One or more selected mentors are not available" });
        }
      }
      const alreadyAssigned = await getActivePodMemberIdsForCohort(data.cohortId);
      const participants = (await getAcceptedCohortParticipants(data.cohortId))
        .filter((participant) => !alreadyAssigned.has(participant.id));
      if (participants.length === 0) return res.status(400).json({ error: "No accepted participants are available for this cohort" });
      const existingPods = await storage.getAllLearningPods();
      const existingNames = new Set(existingPods.filter((pod) => pod.cohortId === data.cohortId).map((pod) => pod.name));
      let nextPodNumber = 1;
      const created = [];
      for (let offset = 0; offset < participants.length; offset += data.podSize) {
        let name = `${data.namePrefix} ${nextPodNumber}`;
        while (existingNames.has(name)) {
          nextPodNumber += 1;
          name = `${data.namePrefix} ${nextPodNumber}`;
        }
        existingNames.add(name);
        const podData = {
          cohortId: data.cohortId,
          name,
          description: `Automatically distributed pod for ${cohort.displayName || cohort.name}.`,
          mentorId: data.mentorIds[created.length % data.mentorIds.length],
          status: "active",
        } as const;
        nextPodNumber += 1;
        const pod = await storage.createLearningPodWithMembers(
          podData,
          participants.slice(offset, offset + data.podSize).map((participant) => participant.id),
        );
        created.push(await getLearningPodResponse(pod, req, true));
      }
      res.status(201).json({ pods: created });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      if (error instanceof LearningPodMembershipConflictError) return res.status(400).json({ error: error.message });
      console.error("Failed to auto-distribute learning pods:", error);
      res.status(500).json({ error: "Failed to auto-distribute learning pods" });
    }
  });

  app.patch("/api/admin/learning-pods/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const existing = await storage.getLearningPod(req.params.id);
      if (!existing) return res.status(404).json({ error: "Learning pod not found" });
      const data = learningPodPayloadSchema.partial().parse(req.body);
      if (data.cohortId && !await storage.getCohort(data.cohortId)) return res.status(404).json({ error: "Cohort not found" });
      if (data.mentorId && !await validateLearningPodMentor(data.mentorId)) {
        return res.status(400).json({ error: "The selected mentor is not available" });
      }
      const nextCohortId = data.cohortId ?? existing.cohortId;
      const nextStatus = data.status ?? existing.status;
      if (nextStatus === "active") {
        const members = await storage.getLearningPodMembers(existing.id);
        const eligibleIds = new Set((await getAcceptedCohortParticipants(nextCohortId)).map((participant) => participant.id));
        if (members.some((member) => !eligibleIds.has(member.userId))) {
          return res.status(400).json({ error: "Every active pod member must be an accepted participant in the pod cohort" });
        }
        const alreadyAssigned = await getActivePodMemberIdsForCohort(nextCohortId, existing.id);
        if (members.some((member) => alreadyAssigned.has(member.userId))) {
          return res.status(400).json({ error: "A participant can only belong to one active pod in a cohort" });
        }
      }
      const pod = await storage.updateLearningPod(existing.id, data);
      res.json(await getLearningPodResponse(pod!, req, true));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      if (error instanceof LearningPodMembershipConflictError) return res.status(400).json({ error: error.message });
      res.status(500).json({ error: "Failed to update learning pod" });
    }
  });

  app.put("/api/admin/learning-pods/:id/members", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const pod = await storage.getLearningPod(req.params.id);
      if (!pod) return res.status(404).json({ error: "Learning pod not found" });
      const { userIds } = learningPodMembersSchema.parse(req.body);
      const eligibleIds = new Set((await getAcceptedCohortParticipants(pod.cohortId)).map((participant) => participant.id));
      if (userIds.some((userId) => !eligibleIds.has(userId))) {
        return res.status(400).json({ error: "Every pod member must be an accepted participant in the pod cohort" });
      }
      const alreadyAssigned = await getActivePodMemberIdsForCohort(pod.cohortId, pod.id);
      if (userIds.some((userId) => alreadyAssigned.has(userId))) {
        return res.status(400).json({ error: "A participant can only belong to one active pod in a cohort" });
      }
      await storage.setLearningPodMembers(pod.id, userIds);
      res.json(await getLearningPodResponse(pod, req, true));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      if (error instanceof LearningPodMembershipConflictError) return res.status(400).json({ error: error.message });
      res.status(500).json({ error: "Failed to update pod members" });
    }
  });

  app.delete("/api/admin/learning-pods/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const pod = await storage.getLearningPod(req.params.id);
      if (!pod) return res.status(404).json({ error: "Learning pod not found" });
      await storage.deleteLearningPod(pod.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete learning pod" });
    }
  });

  app.post("/api/admin/learning-pods/:podId/assignments", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const pod = await storage.getLearningPod(req.params.podId);
      if (!pod) return res.status(404).json({ error: "Learning pod not found" });
      const data = learningPodAssignmentPayloadSchema.parse(req.body);
      const assignment = await storage.createLearningPodAssignment({
        podId: pod.id,
        title: data.title,
        instructions: data.instructions,
        workType: data.workType,
        status: data.status,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
        maxScore: data.maxScore,
        createdById: req.session.userId!,
      });
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      res.status(500).json({ error: "Failed to create pod assignment" });
    }
  });

  app.patch("/api/admin/learning-pods/:podId/assignments/:assignmentId", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const assignment = await storage.getLearningPodAssignment(req.params.assignmentId);
      if (!assignment || assignment.podId !== req.params.podId) return res.status(404).json({ error: "Assignment not found" });
      const data = learningPodAssignmentPayloadSchema.partial().parse(req.body);
      const updated = await storage.updateLearningPodAssignment(assignment.id, {
        ...data,
        dueAt: data.dueAt === undefined ? undefined : data.dueAt ? new Date(data.dueAt) : null,
      });
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      res.status(500).json({ error: "Failed to update pod assignment" });
    }
  });

  app.delete("/api/admin/learning-pods/:podId/assignments/:assignmentId", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const assignment = await storage.getLearningPodAssignment(req.params.assignmentId);
      if (!assignment || assignment.podId !== req.params.podId) return res.status(404).json({ error: "Assignment not found" });
      await storage.deleteLearningPodAssignment(assignment.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete pod assignment" });
    }
  });

  app.get("/api/learning-pods", requireAuth, async (req: Request, res: Response) => {
    try {
      const pods = isAdminSession(req)
        ? await storage.getAllLearningPods()
        : await storage.getLearningPodsByUser(req.session.userId!);
      const visiblePods = isAdminSession(req)
        ? pods
        : (await Promise.all(pods.map(async (pod) => await canAccessLearningPod(req, pod) ? pod : null)))
          .filter((pod): pod is typeof pods[number] => Boolean(pod));
      res.json(await Promise.all(visiblePods.map((pod) => getLearningPodResponse(pod, req))));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch your learning pods" });
    }
  });

  app.get("/api/learning-pods/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const pod = await storage.getLearningPod(req.params.id);
      if (!pod || !(await canAccessLearningPod(req, pod))) return res.status(404).json({ error: "Learning pod not found" });
      res.json(await getLearningPodResponse(pod, req, isAdminSession(req) || pod.mentorId === req.session.userId));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch learning pod" });
    }
  });

  app.post("/api/learning-pods/:podId/assignments/:assignmentId/submissions", requireAuth, async (req: Request, res: Response) => {
    try {
      const pod = await storage.getLearningPod(req.params.podId);
      const assignment = await storage.getLearningPodAssignment(req.params.assignmentId);
      if (!pod || !assignment || assignment.podId !== pod.id || !(await canAccessLearningPod(req, pod))) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      if (isAdminSession(req) || pod.mentorId === req.session.userId) {
        return res.status(403).json({ error: "Mentors and administrators review work; only pod members submit it" });
      }
      if (assignment.status !== "published") return res.status(400).json({ error: "This assignment is not open for submissions" });
      const data = learningPodSubmissionPayloadSchema.parse(req.body);
      const existing = await storage.getLearningPodSubmission(
        assignment.id,
        pod.id,
        assignment.workType === "individual" ? req.session.userId : undefined,
      );
      const submission = existing
        ? await storage.updateLearningPodSubmission(existing.id, {
            submissionText: data.submissionText ?? null,
            submissionUrl: data.submissionUrl ?? null,
            submitterId: req.session.userId!,
          })
        : await storage.createLearningPodSubmission({
            assignmentId: assignment.id,
            podId: pod.id,
            submitterId: req.session.userId!,
            submissionText: data.submissionText ?? null,
            submissionUrl: data.submissionUrl ?? null,
          });
      res.status(existing ? 200 : 201).json(submission);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      res.status(500).json({ error: "Failed to submit pod work" });
    }
  });

  app.patch("/api/learning-pods/:podId/assignments/:assignmentId/submissions/:submissionId/review", requireAuth, async (req: Request, res: Response) => {
    try {
      const pod = await storage.getLearningPod(req.params.podId);
      const assignment = await storage.getLearningPodAssignment(req.params.assignmentId);
      const submission = await storage.getLearningPodSubmissionById(req.params.submissionId);
      if (!pod || !assignment || assignment.podId !== pod.id || !submission ||
          submission.id !== req.params.submissionId ||
          submission.assignmentId !== assignment.id ||
          submission.podId !== pod.id) {
        return res.status(404).json({ error: "Submission not found" });
      }
      if (!isAdminSession(req) && pod.mentorId !== req.session.userId) {
        return res.status(403).json({ error: "Only the assigned mentor can review pod work" });
      }
      const data = learningPodReviewSchema.parse(req.body);
      if (data.score > assignment.maxScore) return res.status(400).json({ error: `Score cannot exceed ${assignment.maxScore}` });
      const reviewed = await storage.updateLearningPodSubmission(submission.id, {
        score: data.score,
        feedback: data.feedback,
        evaluatedById: req.session.userId!,
        evaluatedAt: new Date(),
      });
      res.json(reviewed);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      res.status(500).json({ error: "Failed to review pod work" });
    }
  });

  app.get("/api/mentorship/requests/mentee/:menteeId", requireAuth, async (req: Request, res: Response) => {
    try {
      if (req.params.menteeId !== req.session.userId && !isAdminSession(req)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const requests = await storage.getMentorshipRequestsByMentee(req.params.menteeId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mentorship requests" });
    }
  });

  app.get("/api/mentorship/requests/mentor/:mentorId", requireAuth, async (req: Request, res: Response) => {
    try {
      if (req.params.mentorId !== req.session.userId && !isAdminSession(req)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const requests = await storage.getMentorshipRequestsByMentor(req.params.mentorId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mentorship requests" });
    }
  });

  app.post("/api/mentorship/requests", requireAuth, async (req: Request, res: Response) => {
    try {
      const data = insertMentorshipRequestSchema.parse(req.body);
      if (data.menteeId !== req.session.userId && !isAdminSession(req)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const request = await storage.createMentorshipRequest(data);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create mentorship request" });
    }
  });

  app.patch("/api/mentorship/requests/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const existing = await storage.getMentorshipRequest(req.params.id);
      if (!existing) return res.status(404).json({ error: "Request not found" });
      if (existing.menteeId !== req.session.userId && existing.mentorId !== req.session.userId && !isAdminSession(req)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const request = await storage.updateMentorshipRequest(req.params.id, req.body);
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to update mentorship request" });
    }
  });

  app.get("/api/mentorship/sessions/mentor/:mentorId", requireAuth, async (req: Request, res: Response) => {
    try {
      if (req.params.mentorId !== req.session.userId && !isAdminSession(req)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const sessions = await storage.getMentorshipSessionsByMentor(req.params.mentorId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mentorship sessions" });
    }
  });

  app.get("/api/mentorship/sessions/mentee/:menteeId", requireAuth, async (req: Request, res: Response) => {
    try {
      if (req.params.menteeId !== req.session.userId && !isAdminSession(req)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const sessions = await storage.getMentorshipSessionsByMentee(req.params.menteeId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mentorship sessions" });
    }
  });

  app.post("/api/mentorship/sessions", requireAuth, async (req: Request, res: Response) => {
    try {
      const data = insertMentorshipSessionSchema.parse(req.body);
      if (data.mentorId !== req.session.userId && data.menteeId !== req.session.userId && !isAdminSession(req)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const session = await storage.createMentorshipSession(data);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create mentorship session" });
    }
  });

  app.patch("/api/mentorship/sessions/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const existing = await storage.getMentorshipSession(req.params.id);
      if (!existing) return res.status(404).json({ error: "Session not found" });
      if (existing.mentorId !== req.session.userId && existing.menteeId !== req.session.userId && !isAdminSession(req)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const session = await storage.updateMentorshipSession(req.params.id, req.body);
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to update mentorship session" });
    }
  });

  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const allEvents = req.query.upcoming === "true"
        ? await storage.getUpcomingEvents()
        : await storage.getAllEvents();
      const userRole = (req.session?.userRole as string) || null;
      const isAdminUser = userRole === "admin" || userRole === "superadmin";
      const visibleEvents = isAdminUser
        ? allEvents
        : allEvents.filter(e => canAccessVisibility(e.visibility, userRole));
      res.json(visibleEvents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) return res.status(404).json({ error: "Event not found" });
      const userRole = (req.session?.userRole as string) || null;
      const isAdminUser = userRole === "admin" || userRole === "superadmin";
      if (!isAdminUser && !canAccessVisibility(event.visibility, userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const registrations = await storage.getEventRegistrationsByEvent(req.params.id);
      res.json({ ...event, registrations });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      // Convert datetime-local strings to Date objects
      const body = { ...req.body };
      if (body.startTime && typeof body.startTime === 'string') {
        body.startTime = new Date(body.startTime);
      }
      if (body.endTime && typeof body.endTime === 'string') {
        body.endTime = new Date(body.endTime);
      }
      
      const data = insertEventSchema.parse(body);
      const zoomSync = await provisionZoomMeeting(data);
      const eventData = zoomSync.meeting
        ? {
            ...data,
            zoomMeetingId: zoomSync.meeting.id,
            meetingLink: zoomSync.meeting.joinUrl,
          }
        : data;

      try {
        const event = await storage.createEvent(eventData);
        return res.status(201).json(event);
      } catch (error) {
        if (zoomSync.created && zoomSync.meeting) {
          try {
            const accessToken = await getConnectedZoomAccessToken();
            await deleteZoomMeeting(accessToken, zoomSync.meeting.id);
          } catch (cleanupError) {
            console.error("Failed to clean up orphaned Zoom meeting:", cleanupError);
          }
        }
        throw error;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Failed to create event:", error);
      res.status(502).json({ error: getZoomFailureMessage(error) });
    }
  });

  app.patch("/api/events/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const existing = await storage.getEvent(req.params.id);
      if (!existing) return res.status(404).json({ error: "Event not found" });

      // Convert datetime-local strings to Date objects
      const body = { ...req.body };
      if (body.startTime && typeof body.startTime === 'string') {
        body.startTime = new Date(body.startTime);
      }
      if (body.endTime && typeof body.endTime === 'string') {
        body.endTime = new Date(body.endTime);
      }

      const data = insertEventSchema.partial().parse(body);
      const candidate = { ...existing, ...data };
      const zoomSync = await provisionZoomMeeting(candidate);
      const updateData = zoomSync.meeting
        ? {
            ...data,
            zoomMeetingId: zoomSync.meeting.id,
            meetingLink: zoomSync.meeting.joinUrl,
          }
        : data;

      try {
        const event = await storage.updateEvent(req.params.id, updateData);
        if (!event) {
          // A newly provisioned meeting must not be left behind when the
          // corresponding AFÁRÁ event disappears before the update commits.
          if (zoomSync.created) {
            throw new Error("Event could not be saved after creating the Zoom meeting.");
          }
          return res.status(404).json({ error: "Event not found" });
        }
        return res.json(event);
      } catch (error) {
        if (zoomSync.created && zoomSync.meeting) {
          try {
            const accessToken = await getConnectedZoomAccessToken();
            await deleteZoomMeeting(accessToken, zoomSync.meeting.id);
          } catch (cleanupError) {
            console.error("Failed to clean up orphaned Zoom meeting:", cleanupError);
          }
        }
        throw error;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Failed to update event:", error);
      res.status(502).json({ error: getZoomFailureMessage(error) });
    }
  });

  app.delete("/api/events/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      await storage.deleteEvent(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  app.get("/api/events/:eventId/registrations", async (req: Request, res: Response) => {
    try {
      const registrations = await storage.getEventRegistrationsByEvent(req.params.eventId);
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch registrations" });
    }
  });

  app.get("/api/registrations/user/:userId", async (req: Request, res: Response) => {
    try {
      const registrations = await storage.getEventRegistrationsByUser(req.params.userId);
      const registrationsWithEvents = await Promise.all(
        registrations.map(async (reg) => {
          const event = await storage.getEvent(reg.eventId);
          return { ...reg, event };
        })
      );
      res.json(registrationsWithEvents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch registrations" });
    }
  });

  app.post("/api/events/:eventId/register", async (req: Request, res: Response) => {
    try {
      const data = { eventId: req.params.eventId, userId: req.body.userId };
      const existing = await storage.getEventRegistration(data.userId, data.eventId);
      if (existing) {
        return res.status(400).json({ error: "Already registered for this event" });
      }
      const registration = await storage.createEventRegistration(data);
      res.status(201).json(registration);
    } catch (error) {
      res.status(500).json({ error: "Failed to register for event" });
    }
  });

  app.get("/api/resources", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const allResources = category
        ? await storage.getResourcesByCategory(category)
        : await storage.getAllResources();
      const userRole = (req.session?.userRole as string) || null;
      const isAdminUser = userRole === "admin" || userRole === "superadmin";
      const visibleResources = isAdminUser
        ? allResources
        : allResources.filter(r =>
            r.status === "published" && canAccessVisibility(r.visibility, userRole)
          );
      const accessCheckedResources = isAdminUser
        ? visibleResources
        : (await Promise.all(visibleResources.map(async (resource) => (
          await canAccessResource(req, resource) ? resource : null
        )))).filter((resource): resource is typeof visibleResources[number] => Boolean(resource));
      res.json(accessCheckedResources.map(resource => toResourceResponse(resource, isAdminUser)));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  });

  app.get("/api/resources/:id", async (req: Request, res: Response) => {
    try {
      const resource = await storage.getResource(req.params.id);
      if (!resource) return res.status(404).json({ error: "Resource not found" });
      const userRole = (req.session?.userRole as string) || null;
      const isAdminUser = userRole === "admin" || userRole === "superadmin";
      if (!isAdminUser && resource.status !== "published") {
        return res.status(404).json({ error: "Resource not found" });
      }
      if (!isAdminUser && !canAccessVisibility(resource.visibility, userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (!(await canAccessResource(req, resource))) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(toResourceResponse(resource, isAdminUser));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resource" });
    }
  });

  // Issue a short-lived application-signed playback URL. The URL is not a
  // storage URL: the streaming route checks the viewer's current session and
  // visibility again on every request, including range requests from a video
  // element. This keeps a copied URL from bypassing the LMS access rules.
  app.get("/api/resources/:id/playback", async (req: Request, res: Response) => {
    try {
      const resource = await storage.getResource(req.params.id);
      if (!resource) return res.status(404).json({ error: "Resource not found" });

      const authorization = await getPlaybackAuthorization(req, resource);
      if (authorization.status !== 200) {
        return res.status(authorization.status).json({
          error: authorization.status === 404 ? "Resource not found" : "Access denied",
        });
      }
      if (resource.resourceType !== "video" || resource.videoSource !== "upload" || !resource.videoStorageKey) {
        return res.status(409).json({ error: "This video is not configured for private hosted playback." });
      }
      const token = createPlaybackToken(resource.id, authorization.userId, playbackSecret());
      res.json({
        playbackUrl: `/api/resources/${resource.id}/playback/stream?token=${encodeURIComponent(token)}`,
        expiresAt: Math.floor(Date.now() / 1000) + playbackTokenTtlSeconds,
      });
    } catch (error) {
      console.error("Resource playback authorization failed:", error);
      res.status(500).json({ error: "Unable to authorize video playback" });
    }
  });

  app.get("/api/resources/:id/playback/stream", async (req: Request, res: Response) => {
    try {
      const token = typeof req.query.token === "string"
        ? readPlaybackToken(req.query.token, playbackSecret())
        : null;
      if (!token || token.resourceId !== req.params.id) {
        return res.status(403).json({ error: "Invalid or expired playback URL" });
      }

      const resource = await storage.getResource(req.params.id);
      if (!resource) return res.status(404).json({ error: "Resource not found" });
      const authorization = await getPlaybackAuthorization(req, resource);
      if (authorization.status !== 200) {
        return res.status(authorization.status).json({
          error: authorization.status === 404 ? "Resource not found" : "Access denied",
        });
      }
      if (
        resource.resourceType !== "video" ||
        resource.videoSource !== "upload" ||
        !resource.videoStorageKey
      ) {
        return res.status(409).json({ error: "This video is not configured for private hosted playback." });
      }
      // A restricted token is bound to the session that requested it. Public
      // videos intentionally remain playable without a login, matching the
      // existing public visibility rule.
      if (!isPlaybackTokenAuthorized(resource, token, req.session?.userId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const range = typeof req.headers.range === "string" ? req.headers.range : undefined;
      if (range && !/^bytes=\d*-\d*$/.test(range)) {
        return res.status(416).setHeader("Content-Range", "bytes */*").end();
      }
      const { isR2Configured, getFileStream } = await import("./r2-storage");
      const file = isR2Configured()
        ? await getFileStream(resource.videoStorageKey, range)
        : await getObjectStorageFileStream(resource.videoStorageKey, range);
      res.setHeader("Content-Type", file.contentType || resource.videoContentType || "video/mp4");
      res.setHeader("Accept-Ranges", file.acceptRanges || "bytes");
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("Content-Disposition", "inline");
      if (file.contentLength !== undefined) res.setHeader("Content-Length", file.contentLength);
      if (file.contentRange) res.setHeader("Content-Range", file.contentRange);
      res.status(range ? 206 : 200);
      (file.body as any).pipe(res);
    } catch (error: any) {
      if (!res.headersSent && (error?.name === "NoSuchKey" || error?.$metadata?.httpStatusCode === 404)) {
        return res.status(404).json({ error: "Video file not found" });
      }
      console.error("Private video streaming failed:", error);
      if (!res.headersSent) return res.status(502).json({ error: "Unable to stream this video" });
      res.destroy(error);
    }
  });

  // Resource file upload
  const resourceUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB
  });

  const privateVideoUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
      if (!file.mimetype.startsWith("video/")) {
        callback(new Error("Please upload a video file."));
        return;
      }
      callback(null, true);
    },
  });

  app.post(
    "/api/admin/youtube/videos/resolve",
    requireAuth,
    requireAdminRole,
    async (req: Request, res: Response) => {
      const parsed = z.object({ value: z.string().trim().min(1) }).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Enter a YouTube URL or video ID." });
      }

      const videoId = parseYouTubeVideoId(parsed.data.value);
      if (!videoId) {
        return res.status(400).json({ error: "Enter a valid YouTube video URL or 11-character video ID." });
      }

      try {
        const video = await getYouTubeVideo(videoId);
        if (!video) return res.status(404).json({ error: "This YouTube video could not be found or accessed." });
        res.json(video);
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (/quota|exceeded/i.test(message)) {
          // A valid YouTube ID is enough to embed and save the resource. The
          // Data API lookup only enriches the form with title/thumbnail data,
          // so quota exhaustion should not block adding an existing link.
          return res.json({
            videoId,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            title: `YouTube video ${videoId}`,
            description: "",
            thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            durationSeconds: null,
            privacyStatus: null,
            uploadStatus: null,
          });
        }
        console.error("YouTube video lookup failed:", error);
        res.status(502).json({ error: "Unable to retrieve this video from YouTube. Check the video and try again." });
      }
    },
  );

  app.post(
    "/api/admin/youtube/videos/upload/initiate",
    requireAuth,
    requireAdminRole,
    async (req: Request, res: Response) => {
      const parsed = youtubeResumableUploadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Choose a supported video and add a title between 3 and 100 characters.",
        });
      }

      try {
        const sessionPath = await startYouTubeResumableUpload({
          fileSize: parsed.data.fileSize,
          contentType: parsed.data.contentType,
          title: parsed.data.title,
          description: parsed.data.description,
          privacyStatus: parsed.data.privacyStatus as YouTubePrivacyStatus,
        });
        const uploadId = randomUUID();
        youtubeUploadSessions.set(uploadId, {
          userId: req.session.userId!,
          sessionPath,
          totalBytes: parsed.data.fileSize,
          contentType: parsed.data.contentType,
          nextByte: 0,
          status: "uploading",
          expiresAt: Date.now() + YOUTUBE_UPLOAD_SESSION_TTL_MS,
          operation: Promise.resolve(),
        });
        res.status(201).json({
          uploadId,
          nextByte: 0,
          totalBytes: parsed.data.fileSize,
          status: "uploading",
        });
      } catch (error) {
        console.error("YouTube resumable upload initiation failed:", error);
        res.status(502).json({
          error: "YouTube could not start this upload. Check the connection and try again.",
        });
      }
    },
  );

  app.get(
    "/api/admin/youtube/videos/upload/:uploadId/status",
    requireAuth,
    requireAdminRole,
    async (req: Request, res: Response) => {
      removeExpiredYouTubeUploadSessions();
      const session = youtubeUploadSessions.get(req.params.uploadId);
      if (!session || session.userId !== req.session.userId) {
        return res.status(404).json({ error: "Upload session not found. Select the file again to restart." });
      }
      session.expiresAt = Date.now() + YOUTUBE_UPLOAD_SESSION_TTL_MS;

      if (session.status === "completed" && session.video) {
        return res.json({
          status: session.status,
          nextByte: session.nextByte,
          totalBytes: session.totalBytes,
          video: session.video,
        });
      }

      try {
        await session.operation;
        const result = await getYouTubeUploadStatus({
          sessionPath: session.sessionPath,
          totalBytes: session.totalBytes,
        });
        session.nextByte = result.nextByte;
        session.status = result.status;
        if (result.video) {
          session.video = result.video;
          session.expiresAt = Date.now() + 30 * 60 * 1000;
        }
        res.json({
          status: session.status,
          nextByte: session.nextByte,
          totalBytes: session.totalBytes,
          ...(session.video ? { video: session.video } : {}),
        });
      } catch (error) {
        console.error("YouTube resumable upload status check failed:", error);
        res.status(502).json({
          error: "Could not check the YouTube upload progress. Retrying may restore the connection.",
        });
      }
    },
  );

  app.put(
    "/api/admin/youtube/videos/upload/:uploadId",
    requireAuth,
    requireAdminRole,
    express.raw({ type: "*/*", limit: `${YOUTUBE_UPLOAD_CHUNK_SIZE}b` }),
    async (req: Request, res: Response) => {
      removeExpiredYouTubeUploadSessions();
      const session = youtubeUploadSessions.get(req.params.uploadId);
      if (!session || session.userId !== req.session.userId) {
        return res.status(404).json({ error: "Upload session not found. Select the file again to restart." });
      }
      if (session.status === "completed" && session.video) {
        return res.json({
          status: session.status,
          nextByte: session.nextByte,
          totalBytes: session.totalBytes,
          video: session.video,
        });
      }

      const contentRange = req.headers["content-range"];
      const range = typeof contentRange === "string"
        ? contentRange.match(/^bytes (\d+)-(\d+)\/(\d+)$/)
        : null;
      const chunk = Buffer.isBuffer(req.body) ? req.body : null;
      if (!range || !chunk) {
        return res.status(400).json({ error: "Each upload request must contain one video chunk and its byte range." });
      }

      const startByte = Number(range[1]);
      const endByte = Number(range[2]);
      const totalBytes = Number(range[3]);
      if (
        !Number.isSafeInteger(startByte) ||
        !Number.isSafeInteger(endByte) ||
        !Number.isSafeInteger(totalBytes) ||
        totalBytes !== session.totalBytes ||
        endByte < startByte ||
        endByte - startByte + 1 !== chunk.length ||
        chunk.length > YOUTUBE_UPLOAD_CHUNK_SIZE ||
        endByte >= totalBytes
      ) {
        return res.status(400).json({ error: "The upload chunk range does not match the selected file." });
      }
      if (startByte !== session.nextByte) {
        return res.status(409).json({
          error: "Upload progress is out of sync.",
          nextByte: session.nextByte,
          totalBytes: session.totalBytes,
        });
      }
      session.expiresAt = Date.now() + YOUTUBE_UPLOAD_SESSION_TTL_MS;

      const previousOperation = session.operation;
      let releaseOperation: (() => void) | undefined;
      session.operation = previousOperation.then(() => new Promise<void>((resolve) => {
        releaseOperation = resolve;
      }));
      await previousOperation;

      try {
        const result = await uploadYouTubeChunk({
          sessionPath: session.sessionPath,
          chunk,
          startByte,
          totalBytes,
          contentType: session.contentType,
        });
        session.nextByte = result.nextByte;
        session.status = result.status;
        if (result.video) {
          session.video = result.video;
          session.expiresAt = Date.now() + 30 * 60 * 1000;
        }
        res.json({
          status: session.status,
          nextByte: session.nextByte,
          totalBytes: session.totalBytes,
          ...(session.video ? { video: session.video } : {}),
        });
      } catch (error) {
        console.error("YouTube resumable upload chunk failed:", error);
        res.status(502).json({
          error: "The video chunk could not reach YouTube. Checking progress before retrying.",
        });
      } finally {
        releaseOperation?.();
      }
    },
  );

  app.post(
    "/api/admin/resources/videos/upload",
    requireAuth,
    requireAdminRole,
    (req: Request, res: Response, next: NextFunction) => {
      privateVideoUpload.single("video")(req, res, (err) => {
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "Video exceeds the 10 MB upload limit. Compress the video before uploading." });
        }
        if (err) return res.status(400).json({ error: err.message || "Video upload failed." });
        next();
      });
    },
    async (req: Request, res: Response) => {
      if (!req.file) return res.status(400).json({ error: "Choose a video file to upload." });
      const uploadedById = req.session.userId;
      if (!uploadedById) return res.status(401).json({ error: "Authentication required" });
      const { isR2Configured, uploadFile, deletePrivateVideo: deleteR2PrivateVideo } = await import("./r2-storage");
      try {
        if (!isR2Configured() && !isObjectStorageConfigured()) {
          return res.status(503).json({
            error: "Private video hosting is not configured. Connect Replit Object Storage or add the private storage settings before uploading protected videos.",
          });
        }
        const originalName = req.file.originalname || "video.mp4";
        const ext = originalName.includes(".") ? originalName.split(".").pop()! : "mp4";
        const key = `resources/private-videos/${randomUUID()}.${ext}`;
        const contentType = req.file.mimetype || "video/mp4";
        const result = isR2Configured()
          ? await uploadFile(key, req.file.buffer, contentType, false)
          : await uploadPrivateVideo(key, req.file.buffer, contentType);
        let upload;
        try {
          upload = await storage.trackPrivateVideoUpload(result.key, uploadedById);
        } catch (error) {
          try {
            if (isR2Configured()) {
              await deleteR2PrivateVideo(result.key);
            } else {
              await deleteObjectStorageFile(result.key);
            }
          } catch (cleanupError) {
            console.error("Failed to clean up untracked private video upload:", cleanupError);
          }
          throw error;
        }
        res.status(201).json({
          videoSource: "upload",
          videoStorageKey: result.key,
          uploadId: upload.id,
          fileName: originalName,
          fileSize: req.file.size,
          contentType: req.file.mimetype || "video/mp4",
        });
      } catch (error) {
        console.error("Private video upload failed:", error);
        res.status(isR2Configured() ? 502 : 503).json({
          error: isR2Configured()
            ? "Private video hosting could not store this upload. Try again."
            : "Replit Object Storage is not available for private video uploads. Enable the project’s Object Storage bucket, then try again.",
        });
      }
    },
  );

  app.post(
    "/api/resources/upload",
    requireAuth,
    requireAdminRole,
    (req: Request, res: Response, next: NextFunction) => {
      resourceUpload.single("file")(req, res, (err) => {
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File exceeds 4 MB limit. Please upload a smaller file." });
        }
        if (err) {
          return res.status(400).json({ error: err.message || "Upload error" });
        }
        next();
      });
    },
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file provided" });
        }

        const { isR2Configured, uploadFile } = await import("./r2-storage");
        const originalName = req.file.originalname || "file";
        const ext = originalName.includes(".") ? originalName.split(".").pop()! : "bin";
        const { randomUUID } = await import("crypto");
        const key = `resources/${randomUUID()}.${ext}`;

        let fileUrl: string;
        if (isR2Configured()) {
          const result = await uploadFile(key, req.file.buffer, req.file.mimetype, true);
          fileUrl = result.url;
        } else {
          const base64 = req.file.buffer.toString("base64");
          fileUrl = `data:${req.file.mimetype};base64,${base64}`;
        }

        res.json({
          fileUrl,
          fileName: originalName,
          fileSize: req.file.size,
          contentType: req.file.mimetype,
        });
      } catch (error) {
        console.error("Resource upload error:", error);
        res.status(500).json({ error: "Failed to upload file" });
      }
    }
  );

  app.post("/api/resources", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const data = youtubeVideoResourceSchema.parse(req.body);
      const resource = await storage.createResource(data);
      if (data.videoStorageKey) {
        await claimPrivateVideoUpload(data.videoStorageKey, resource.id);
      }
      res.status(201).json(resource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create resource" });
    }
  });

  app.patch("/api/resources/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const existing = await storage.getResource(req.params.id);
      if (!existing) return res.status(404).json({ error: "Resource not found" });
      const data = insertResourceSchema.partial().parse(req.body);
      youtubeVideoResourceSchema.parse({ ...existing, ...data });
      const resource = await storage.updateResource(req.params.id, data);
      const existingUsesPrivateVideo = existing.videoSource === "upload" ||
        (!existing.videoSource && Boolean(existing.videoStorageKey));
      const updatedUsesPrivateVideo = resource?.videoSource === "upload" ||
        (!resource?.videoSource && Boolean(resource?.videoStorageKey));
      if (
        resource &&
        existingUsesPrivateVideo &&
        (!updatedUsesPrivateVideo || existing.videoStorageKey !== resource.videoStorageKey)
      ) {
        await cleanupPrivateVideo(existing.id, existing.videoStorageKey);
      }
      if (resource?.videoStorageKey) {
        await claimPrivateVideoUpload(resource.videoStorageKey, resource.id);
      }
      res.json(resource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update resource" });
    }
  });

  app.delete("/api/resources/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const existing = await storage.getResource(req.params.id);
      if (!existing) return res.status(404).json({ error: "Resource not found" });
      await storage.deleteResource(req.params.id);
      await cleanupPrivateVideo(existing.id, existing.videoStorageKey);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete resource" });
    }
  });

  app.post("/api/resources/:id/download", async (req: Request, res: Response) => {
    try {
      const resource = await storage.getResource(req.params.id);
      if (!resource) return res.status(404).json({ error: "Resource not found" });
      
      // Check visibility: admins bypass; others must have access based on visibility
      const userRole = req.session?.userRole || null;
      if (userRole !== "admin" && userRole !== "superadmin") {
        if (!canAccessVisibility(resource.visibility, userRole)) {
          return res.status(403).json({ error: "Access denied: cohort members only" });
        }
        if (!(await canAccessResource(req, resource))) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      await storage.incrementResourceDownload(req.params.id);
      res.json(resource);
    } catch (error) {
      res.status(500).json({ error: "Failed to track download" });
    }
  });

  // Return only safe public fields for author objects in community API responses
  type SafeAuthor = { id: string; firstName: string; lastName: string; profileImageUrl: string | null } | undefined;
  function toPublicAuthor(user: { id: string; firstName: string; lastName: string; profileImageUrl?: string | null; [k: string]: unknown } | undefined | null): SafeAuthor {
    if (!user) return undefined;
    return { id: user.id, firstName: user.firstName, lastName: user.lastName, profileImageUrl: user.profileImageUrl ?? null };
  }

  app.get("/api/community/threads", requireAuth, async (req: Request, res: Response) => {
    try {
      const threads = await storage.getAllDiscussionThreads();
      const threadsWithAuthors = await Promise.all(
        threads.map(async (thread) => {
          const author = await storage.getUser(thread.authorId);
          return { ...thread, author: toPublicAuthor(author) };
        })
      );
      res.json(threadsWithAuthors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch threads" });
    }
  });

  app.get("/api/community/threads/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const thread = await storage.getDiscussionThread(req.params.id);
      if (!thread) return res.status(404).json({ error: "Thread not found" });
      await storage.incrementThreadView(req.params.id);
      const author = await storage.getUser(thread.authorId);
      const posts = await storage.getDiscussionPostsByThread(req.params.id);
      const postsWithAuthors = await Promise.all(
        posts.map(async (post) => {
          const postAuthor = await storage.getUser(post.authorId);
          return { ...post, author: toPublicAuthor(postAuthor) };
        })
      );
      res.json({ ...thread, author: toPublicAuthor(author), posts: postsWithAuthors });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch thread" });
    }
  });

  app.post("/api/community/threads", requireAuth, async (req: Request, res: Response) => {
    try {
      // Explicitly whitelist allowed creation fields; moderation fields are always server-defaulted
      const data = insertDiscussionThreadSchema.parse({
        title: req.body.title,
        content: req.body.content,
        category: req.body.category,
        attachmentJson: req.body.attachmentJson,
        authorId: req.session.userId,
        isPinned: false,
        isLocked: false,
        viewCount: 0,
        replyCount: 0,
      });
      const thread = await storage.createDiscussionThread(data);

      // Send individual email notifications (per-recipient to avoid PII leakage)
      try {
        const participants = await storage.getUsersByRole("participant");
        const communityMembers = await storage.getUsersByRole("community_member");
        const recipients = [...participants, ...communityMembers]
          .filter(u => u.id !== req.session.userId && u.email);
        if (recipients.length > 0) {
          const { getResendClient } = await import("./email");
          const { client, fromEmail } = await getResendClient();
          const author = await storage.getUser(req.session.userId!);
          const authorName = author ? `${author.firstName} ${author.lastName}` : "A community member";
          const subject = `New Discussion: ${thread.title}`;
          const excerpt = thread.content
            ? thread.content.slice(0, 200) + (thread.content.length > 200 ? "…" : "")
            : "";
          const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#166534;">New Community Discussion</h2>
            <p><strong>${authorName}</strong> started a new discussion:</p>
            <h3 style="color:#166534;">${thread.title}</h3>
            ${excerpt ? `<p style="color:#555;">${excerpt}</p>` : ""}
            <p><a href="https://afaraaccelerator.org/lms/community/${thread.id}" style="color:#166534;">Join the discussion &rarr;</a></p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
            <p style="font-size:12px;color:#6b7280;">AFÁRÁ is an initiative of Open Spaces &amp; Bridges Advisory (OPSB)</p>
          </div>`;
          // Send individually to prevent PII leakage; throttle at 2 sends/sec to respect provider limits
          const BATCH_DELAY_MS = 500;
          for (let i = 0; i < recipients.length; i++) {
            try {
              await client.emails.send({ from: fromEmail, to: recipients[i].email, subject, html });
            } catch (singleErr) {
              console.error(`Failed to notify ${recipients[i].email}:`, singleErr);
            }
            if (i < recipients.length - 1) {
              await new Promise<void>((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
            }
          }
        }
      } catch (emailErr) {
        console.error("Failed to send thread notification emails:", emailErr);
      }

      res.status(201).json(thread);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create thread" });
    }
  });

  app.patch("/api/community/threads/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const role = req.session?.userRole;
      const isAdminUser = role === "admin" || role === "superadmin";
      const thread = await storage.getDiscussionThread(req.params.id);
      if (!thread) return res.status(404).json({ error: "Thread not found" });
      if (!isAdminUser && thread.authorId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized to edit this thread" });
      }

      // Non-admins (even owners) cannot touch moderation fields
      const { isPinned, isLocked, ...contentFields } = req.body;
      const patch: Record<string, unknown> = { ...contentFields };
      if (isAdminUser) {
        if (isPinned !== undefined) patch.isPinned = isPinned;
        if (isLocked !== undefined) patch.isLocked = isLocked;
      }

      const updated = await storage.updateDiscussionThread(req.params.id, patch);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update thread" });
    }
  });

  app.delete("/api/community/threads/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const role = req.session?.userRole;
      const isAdminUser = role === "admin" || role === "superadmin";
      if (!isAdminUser) {
        return res.status(403).json({ error: "Only admins can delete threads" });
      }
      const thread = await storage.getDiscussionThread(req.params.id);
      if (!thread) return res.status(404).json({ error: "Thread not found" });
      await storage.deleteDiscussionThread(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete thread" });
    }
  });

  app.post("/api/community/threads/:threadId/posts", requireAuth, async (req: Request, res: Response) => {
    try {
      const thread = await storage.getDiscussionThread(req.params.threadId);
      if (!thread) return res.status(404).json({ error: "Thread not found" });
      if (thread.isLocked) {
        const role = req.session?.userRole;
        if (role !== "admin" && role !== "superadmin") {
          return res.status(403).json({ error: "This thread is locked" });
        }
      }
      const data = insertDiscussionPostSchema.parse({
        ...req.body,
        threadId: req.params.threadId,
        authorId: req.session.userId,
      });
      // storage.createDiscussionPost already increments replyCount
      const post = await storage.createDiscussionPost(data);
      const author = await storage.getUser(post.authorId);
      res.status(201).json({ ...post, author: toPublicAuthor(author) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.patch("/api/community/posts/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const role = req.session?.userRole;
      const isAdminUser = role === "admin" || role === "superadmin";
      const post = await storage.getDiscussionPost(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });
      if (!isAdminUser && post.authorId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized to edit this post" });
      }
      const updated = await storage.updateDiscussionPost(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  app.delete("/api/community/posts/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const role = req.session?.userRole;
      const isAdminUser = role === "admin" || role === "superadmin";
      if (!isAdminUser) {
        return res.status(403).json({ error: "Only admins can delete posts" });
      }
      const post = await storage.getDiscussionPost(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });
      await storage.deleteDiscussionPost(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  app.get("/api/certificates/user/:userId", requireAuth, async (req: Request, res: Response) => {
    try {
      if (req.params.userId !== req.session.userId && !isAdminSession(req)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const userCertificates = await storage.getCertificatesByUser(req.params.userId);
      const certificatesWithCourses = await Promise.all(
        userCertificates.map(async (cert) => {
          const course = await storage.getCourse(cert.courseId);
          return { ...cert, course };
        })
      );
      res.json(certificatesWithCourses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch certificates" });
    }
  });

  app.get("/api/certificates/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const certificate = await storage.getCertificate(req.params.id);
      if (!certificate) return res.status(404).json({ error: "Certificate not found" });
      if (certificate.userId !== req.session.userId && !isAdminSession(req)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const course = await storage.getCourse(certificate.courseId);
      const user = await storage.getUser(certificate.userId);
      const safeUser = user ? sanitizeUser(user) : null;
      res.json({ ...certificate, course, user: safeUser });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch certificate" });
    }
  });

  app.post("/api/certificates", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const data = insertCertificateSchema.parse({
        ...req.body,
        certificateNumber: `AFARA-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`
      });
      const certificate = await storage.createCertificate(data);
      res.status(201).json(certificate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create certificate" });
    }
  });

  app.get("/api/achievements", async (req: Request, res: Response) => {
    try {
      const allAchievements = await storage.getAllAchievements();
      res.json(allAchievements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.get("/api/achievements/user/:userId", async (req: Request, res: Response) => {
    try {
      const userAchievementsList = await storage.getUserAchievements(req.params.userId);
      res.json(userAchievementsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user achievements" });
    }
  });

  app.post("/api/achievements/award", async (req: Request, res: Response) => {
    try {
      const { userId, achievementId } = req.body;
      await storage.awardAchievement(userId, achievementId);
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to award achievement" });
    }
  });

  app.get("/api/notifications/user/:userId", async (req: Request, res: Response) => {
    try {
      const userNotifications = await storage.getNotificationsByUser(req.params.userId);
      res.json(userNotifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", async (req: Request, res: Response) => {
    try {
      const data = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(data);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req: Request, res: Response) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/user/:userId/read-all", async (req: Request, res: Response) => {
    try {
      await storage.markAllNotificationsRead(req.params.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // Recommendations API - content-based matching
  app.get("/api/recommendations/:userId", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const limit = parseInt(req.query.limit as string) || 6;
      
      // Get user profile for interests
      const profile = await storage.getProfile(userId);
      const userInterests = [
        ...(profile?.expertiseAreas || []),
        ...(profile?.industries || [])
      ].map(i => i.toLowerCase());
      
      // Get all published courses and resources
      const allCourses = await storage.getAllCourses();
      const allResources = await storage.getAllResources();
      
      const publishedCourses = allCourses.filter(c => c.status === "published");
      const publishedResources = allResources.filter(r => r.status === "published");
      
      // Score function - matches content keywords with user interests
      const scoreContent = (content: { 
        category?: string | null; 
        title: string; 
        description?: string | null;
        tags?: string[] | null;
      }) => {
        let score = 0;
        const searchableText = [
          content.category || "",
          content.title,
          content.description || "",
          ...(content.tags || [])
        ].join(" ").toLowerCase();
        
        for (const interest of userInterests) {
          if (searchableText.includes(interest)) {
            score += 2;
          }
          // Partial match
          const words = interest.split(/\s+/);
          for (const word of words) {
            if (word.length > 3 && searchableText.includes(word)) {
              score += 1;
            }
          }
        }
        
        // Default score for new content (boost recently added)
        if (score === 0) {
          score = 0.5;
        }
        
        return score;
      };
      
      // Score and sort courses
      const scoredCourses = publishedCourses.map(course => ({
        ...course,
        score: scoreContent({
          category: course.category,
          title: course.title,
          description: course.description,
          tags: course.learningOutcomes
        }),
        type: "course" as const
      })).sort((a, b) => b.score - a.score).slice(0, limit);
      
      // Score and sort resources
      const scoredResources = publishedResources.map(resource => ({
        ...resource,
        score: scoreContent({
          category: resource.category,
          title: resource.title,
          description: resource.description,
          tags: null
        }),
        type: "resource" as const
      })).sort((a, b) => b.score - a.score).slice(0, limit);
      
      res.json({
        courses: scoredCourses,
        resources: scoredResources,
        userInterests
      });
    } catch (error) {
      console.error("Recommendations error:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  app.post("/api/admin/test-email", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { type, email, firstName, cohortId } = req.body;
      const { sendApplicationConfirmationEmail, sendWelcomeEmail, sendAcceptanceEmail, sendDraftSaveNotificationEmail, getApplicationStepCount } = await import("./email");
      const cohort = cohortId ? await storage.getCohort(cohortId) : undefined;
      if (cohortId && !cohort) return res.status(404).json({ error: "Cohort not found" });
      let result;
      // The cohort preview dialog calls this email "confirmation"; keep
      // "application" as a backwards-compatible alias for older callers.
      if (type === "confirmation" || type === "application") {
        result = await sendApplicationConfirmationEmail(email, firstName, cohort);
      }
      else if (type === "welcome") result = await sendWelcomeEmail(email, firstName);
      else if (type === "acceptance") result = await sendAcceptanceEmail(email, firstName, undefined, cohort);
      else if (type === "draft-save") result = await sendDraftSaveNotificationEmail(email, firstName, 2, getApplicationStepCount(cohort), undefined, cohort);
      else return res.status(400).json({ error: "Unknown type. Use: confirmation | welcome | acceptance | draft-save" });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/stats", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const allCourses = await storage.getAllCourses();
      const allEvents = await storage.getAllEvents();
      const allResources = await storage.getAllResources();
      const threads = await storage.getAllDiscussionThreads();
      const allApplications = await storage.getAllApplications();
      
      res.json({
        totalUsers: users.length,
        participantCount: users.filter(u => u.role === "participant").length,
        mentorCount: users.filter(u => u.role === "mentor").length,
        facilitatorCount: users.filter(u => u.role === "facilitator").length,
        adminCount: users.filter(u => u.role === "admin").length,
        totalCourses: allCourses.length,
        publishedCourses: allCourses.filter(c => c.status === "published").length,
        totalEvents: allEvents.length,
        totalResources: allResources.length,
        totalDiscussions: threads.length,
        totalApplications: allApplications.length,
        pendingApplications: allApplications.filter(a => a.status === "submitted" || a.status === "under_review").length
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  // Application Routes (Admin-only for listing/managing; public POST for submission)
  // Application file upload (public – no auth required, anyone filling the form can upload)
  const applicationFileUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB
  });

  app.post(
    "/api/applications/upload-file",
    (req: Request, res: Response, next: NextFunction) => {
      applicationFileUpload.single("file")(req, res, (err) => {
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File exceeds 4 MB limit. Please upload a smaller file." });
        }
        if (err) {
          return res.status(400).json({ error: err.message || "Upload error" });
        }
        next();
      });
    },
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file provided" });
        }
        const { isR2Configured, uploadFile } = await import("./r2-storage");
        const originalName = req.file.originalname || "file";
        const ext = originalName.includes(".") ? originalName.split(".").pop()! : "bin";
        const { randomUUID } = await import("crypto");
        const key = `applications/${randomUUID()}.${ext}`;

        let fileUrl: string;
        if (isR2Configured()) {
          const result = await uploadFile(key, req.file.buffer, req.file.mimetype, true);
          fileUrl = result.url;
        } else {
          const base64 = req.file.buffer.toString("base64");
          fileUrl = `data:${req.file.mimetype};base64,${base64}`;
        }

        res.json({ fileUrl, fileName: originalName, fileSize: req.file.size });
      } catch (error) {
        console.error("Application file upload error:", error);
        res.status(500).json({ error: "Failed to upload file" });
      }
    }
  );

  app.get("/api/applications", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string;
      let allApplications = status 
        ? await storage.getApplicationsByStatus(status)
        : await storage.getAllApplications();
      const cohortId = req.query.cohortId as string | undefined;
      if (cohortId) {
        allApplications = allApplications.filter((a) => a.cohortId === cohortId);
      }
      res.json(allApplications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  // Public: look up a saved draft by email.
  // Without a token: returns only non-sensitive metadata (id, firstName, currentStep, updatedAt).
  // With a valid resumeToken: returns full applicant-controlled form data (internal review fields stripped).
  app.get("/api/applications/draft", async (req: Request, res: Response) => {
    try {
      const email = ((req.query.email as string) || "").trim().toLowerCase();
      if (!email) return res.status(400).json({ error: "Email is required" });
      const application = await storage.getApplicationDraftByEmail(email);
      if (!application) return res.status(404).json({ error: "No draft found" });

      const providedToken = (req.query.token as string | undefined) || "";
      const storedToken = application.resumeToken || "";
      const tokenValid = providedToken && storedToken && providedToken === storedToken;

      if (tokenValid) {
        const { reviewNotes, reviewedById, reviewedAt, lastDraftEmailSentAt, resumeToken: _tok, ...fullDraft } = application;
        return res.json(fullDraft);
      }

      res.json({
        id: application.id,
        firstName: application.firstName,
        currentStep: application.currentStep,
        updatedAt: application.updatedAt,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch draft" });
    }
  });

  // Public: look up application status by email + resumeToken.
  // Requires the resumeToken to prevent unauthenticated enumeration and status disclosure.
  app.get("/api/applications/status", async (req: Request, res: Response) => {
    try {
      const email = ((req.query.email as string) || "").trim().toLowerCase();
      if (!email) return res.status(400).json({ error: "Email is required" });
      const providedToken = ((req.query.token as string) || "").trim();
      if (!providedToken) return res.status(403).json({ error: "A resume token is required to check application status" });
      const application = await storage.getMostRecentApplicationByEmail(email);
      if (!application) return res.status(404).json({ error: "No application found" });
      const storedToken = application.resumeToken || "";
      if (!storedToken || providedToken !== storedToken) {
        return res.status(403).json({ error: "Invalid resume token" });
      }
      res.json({
        status: application.status,
        submittedAt: application.submittedAt,
        updatedAt: application.updatedAt,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch application status" });
    }
  });

  app.get("/api/applications/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) return res.status(404).json({ error: "Application not found" });
      res.json(application);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch application" });
    }
  });

  app.post("/api/applications", async (req: Request, res: Response) => {
    try {
      const normalized = normalizeApplicationBody(req.body);
      const raw = insertApplicationSchema.parse(normalized);
      const data: typeof raw & { submittedAt?: Date | null } = { ...raw, email: raw.email.toLowerCase().trim() };
      if (data.status === "submitted") {
        data.submittedAt = new Date();
      }

      if (data.status === "submitted") {
        const existing = await storage.getSubmittedApplicationByEmail(data.email);
        if (existing) {
          return res.status(409).json({ error: "An application from this email address has already been submitted." });
        }
      }

      // Explicit cohort assignment: the public apply flow resolves a cohort by
      // slug (bare /apply resolves to the primary/core cohort client-side) and
      // sends it as `cohortSlug`. This is looked up server-side rather than
      // trusting a client-supplied cohortId directly.
      const requestedSlug = typeof req.body.cohortSlug === "string" ? req.body.cohortSlug.trim() : "";
      let resolvedCohort = requestedSlug ? await storage.getCohortBySlug(requestedSlug) : undefined;
      if (requestedSlug && !resolvedCohort) {
        return res.status(400).json({ error: "This application link is not associated with a valid cohort." });
      }
      if (resolvedCohort) {
        (data as any).cohortId = resolvedCohort.id;
      } else {
        // Never guess a cohort from whichever one happens to be open. A
        // submitted application must come through an explicit cohort link.
        if (data.status === "submitted") {
          return res.status(400).json({ error: "Choose a cohort-specific application link before submitting." });
        }
      }

      if (data.status === "submitted") {
        if (!resolvedCohort || !isCohortAcceptingApplications(resolvedCohort)) {
          return res.status(400).json({ error: "Applications for this cohort are currently closed." });
        }
        const validationError = validateExtraAnswers(resolvedCohort, (data as any).extraAnswers);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }
      }

      const application = await storage.createApplication(data);
      const cohortEmailInfo = resolvedCohort
        ? {
            name: resolvedCohort.displayName || resolvedCohort.name,
            sponsor: resolvedCohort.sponsor,
            partnershipNote: resolvedCohort.partnershipNote,
            slug: resolvedCohort.slug,
            extraQuestions: resolvedCohort.extraQuestions,
          }
        : undefined;
      const applyPath = resolvedCohort ? `/apply/${resolvedCohort.slug}` : "/apply";

      if (data.status === "draft") {
        // First-time draft save: send progress notification email (fire-and-forget)
        const stepNumber = typeof req.body.currentStep === "number" ? req.body.currentStep : 0;
        const token = application.resumeToken;
        const baseUrl = process.env.APP_URL || "https://afaraaccelerator.org";
        const resumeUrl = token
          ? `${baseUrl}${applyPath}?token=${encodeURIComponent(token)}&email=${encodeURIComponent(application.email)}`
          : `${baseUrl}${applyPath}`;
        import("./email").then(({ sendDraftSaveNotificationEmail, getApplicationStepCount }) => {
          sendDraftSaveNotificationEmail(application.email, data.firstName, stepNumber, getApplicationStepCount(cohortEmailInfo), resumeUrl, cohortEmailInfo)
            .catch(err => console.error("Draft save notification email failed:", err));
        }).catch(err => console.error("Failed to import email module:", err));
      }

      // When status is "submitted", send confirmation email only.
      // Account provisioning is deferred until admin acceptance to avoid creating
      // accounts for unverified email addresses.
      if (data.status === "submitted") {
        try {
          const { sendApplicationConfirmationEmail } = await import("./email");
          await sendApplicationConfirmationEmail(data.email, data.firstName, cohortEmailInfo);
        } catch (innerError) {
          console.error("Failed to send application confirmation email:", innerError);
        }
        triggerAutoEvaluate(application.id);
      }

      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to submit application" });
    }
  });

  // Normalize raw application body before DB writes:
  // - converts "yes"/"no" strings to booleans for boolean columns
  // - strips any keys not present in the applications table (avoids Drizzle unknown-column errors)
  const KNOWN_APPLICATION_FIELDS = new Set([
    "email","firstName","lastName","phone","countryOfOperation","companyName",
    "roleInCompany","personalStatement","videoEssayUrl",
    "professionalBackground","yearsOfExperience","keyResponsibilities",
    "majorAchievements","hasLedTeams","teamLeadershipExperience",
    "hasProjectExperience","projectExperience","primarySector",
    "sectorSpecification","subSectors","otherSubSector",
    "businessDescription","problemBeingSolved","businessStage",
    "tractionEvidence","targetMarket","scalabilityExplanation",
    "growthPlans","isRaisingFunding",
    "companyLegalName","companyCountry","companyHeadquarters",
    "incorporationYear","ownershipPercentage","numberOfShareholders",
    "shareholdersOver25Percent",
    "isIncorporated","incorporationCertificateUrl","registrationProofUrl",
    "revenueStreams","keepsFinancialRecords","pitchDeckUrl","businessPlanUrl",
    "financialStatementsUrl","canProvideFinancials","isTaxRegistered",
    "projectDescription","projectLocation","projectSector",
    "projectCurrentStatus","projectStage","projectDocuments",
    "otherProjectDocuments","projectedImpact",
    "businessImpact","primaryBeneficiaries","infrastructureGapContribution",
    "createsWomenOpportunities","womenOpportunitiesDescription",
    "mainChallenges","supportAreasNeeded","otherSupportArea",
    "keyActivitiesForNextStage","fundingRequired","expectedTimeline",
    "specificProgramOutcomes","hoursPerWeek","openToMentorship",
    "canCommitToProgram","canAttendLagosEvent","commitmentManagementPlan",
    "willingToMentor","peerMentorshipImportance",
    "whyAfaraIsRight","linkedinUrl","additionalInfo","extraAnswers",
    "currentStep","status","reviewNotes","reviewedById",
    "reviewedAt","updatedAt","submittedAt","lastDraftEmailSentAt",
  ]);

  // Allowlist for fields writable via the public (unauthenticated) draft-save endpoint.
  // Internal review/workflow fields are intentionally excluded to prevent tampering.
  const PUBLIC_PATCH_APPLICATION_FIELDS = new Set([
    "firstName","lastName","phone","countryOfOperation","companyName",
    "roleInCompany","personalStatement","videoEssayUrl",
    "professionalBackground","yearsOfExperience","keyResponsibilities",
    "majorAchievements","hasLedTeams","teamLeadershipExperience",
    "hasProjectExperience","projectExperience","primarySector",
    "sectorSpecification","subSectors","otherSubSector",
    "businessDescription","problemBeingSolved","businessStage",
    "tractionEvidence","targetMarket","scalabilityExplanation",
    "growthPlans","isRaisingFunding",
    "companyLegalName","companyCountry","companyHeadquarters",
    "incorporationYear","ownershipPercentage","numberOfShareholders",
    "shareholdersOver25Percent",
    "isIncorporated","incorporationCertificateUrl","registrationProofUrl",
    "revenueStreams","keepsFinancialRecords","pitchDeckUrl","businessPlanUrl",
    "financialStatementsUrl","canProvideFinancials","isTaxRegistered",
    "projectDescription","projectLocation","projectSector",
    "projectCurrentStatus","projectStage","projectDocuments",
    "otherProjectDocuments","projectedImpact",
    "businessImpact","primaryBeneficiaries","infrastructureGapContribution",
    "createsWomenOpportunities","womenOpportunitiesDescription",
    "mainChallenges","supportAreasNeeded","otherSupportArea",
    "keyActivitiesForNextStage","fundingRequired","expectedTimeline",
    "specificProgramOutcomes","hoursPerWeek","openToMentorship",
    "canCommitToProgram","canAttendLagosEvent","commitmentManagementPlan",
    "willingToMentor","peerMentorshipImportance",
    "whyAfaraIsRight","linkedinUrl","additionalInfo","extraAnswers",
    "currentStep","status",
  ]);
  const YES_NO_BOOLEAN_FIELDS = new Set(["canProvideFinancials","isTaxRegistered"]);
  // Drizzle's PgTimestamp.mapToDriverValue calls .toISOString(), so these must be Date objects, not strings
  const TIMESTAMP_FIELDS = new Set(["submittedAt","reviewedAt","lastDraftEmailSentAt"]);

  const INTEGER_APPLICATION_FIELDS = new Set([
    "yearsOfExperience","incorporationYear","ownershipPercentage",
    "numberOfShareholders","hoursPerWeek","currentStep",
  ]);

  function isCohortAcceptingApplications(cohort: Cohort): boolean {
    if (cohort.status !== "open" || !cohort.isOpen) return false;
    const now = Date.now();
    if (cohort.applicationOpenAt && now < new Date(cohort.applicationOpenAt).getTime()) return false;
    if (cohort.applicationCloseAt && now > new Date(cohort.applicationCloseAt).getTime()) return false;
    return true;
  }

  function normalizeApplicationBody(body: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (!KNOWN_APPLICATION_FIELDS.has(key)) continue; // drop unknown fields
      if (YES_NO_BOOLEAN_FIELDS.has(key)) {
        if (value === "yes") { out[key] = true; continue; }
        if (value === "no")  { out[key] = false; continue; }
      }
      // Coerce integer fields from string to number (HTML inputs always return strings)
      if (INTEGER_APPLICATION_FIELDS.has(key) && typeof value === "string") {
        if (value === "") continue; // treat empty as missing
        const n = parseInt(value, 10);
        if (!isNaN(n)) { out[key] = n; continue; }
        continue; // skip non-numeric garbage
      }
      // Convert ISO timestamp strings to Date objects for Drizzle
      if (TIMESTAMP_FIELDS.has(key) && typeof value === "string" && value) {
        out[key] = new Date(value);
        continue;
      }
      if (key === "extraAnswers") {
        out[key] = extraAnswersSchema.parse(value);
        continue;
      }
      out[key] = value;
    }
    return out;
  }

  // Public variant: only allows applicant-controlled fields; strips internal review/workflow fields
  function normalizeApplicationBodyPublic(body: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (!PUBLIC_PATCH_APPLICATION_FIELDS.has(key)) continue;
      if (YES_NO_BOOLEAN_FIELDS.has(key)) {
        if (value === "yes") { out[key] = true; continue; }
        if (value === "no")  { out[key] = false; continue; }
      }
      if (key === "extraAnswers") {
        // Reject malformed shapes here (e.g. a non-object, or values that
        // aren't string/boolean) rather than letting them reach storage.
        out[key] = extraAnswersSchema.parse(value);
        continue;
      }
      out[key] = value;
    }
    return out;
  }

  // Public: applicants save/submit their own draft
  // Ownership is proved by the resumeToken issued when the draft was created.
  // If no token is stored (legacy row), email match is used as fallback.
  app.patch("/api/applications/:id/save", async (req: Request, res: Response) => {
    try {
      const newStatus = req.body.status;
      const allowedPublicStatuses = [undefined, "draft", "submitted"];
      if (newStatus && !allowedPublicStatuses.includes(newStatus)) {
        return res.status(403).json({ error: "Forbidden: only draft and submitted transitions are allowed on this endpoint" });
      }

      const existing = await storage.getApplication(req.params.id);
      if (!existing) return res.status(404).json({ error: "Application not found" });

      // Ownership check — token-based (primary) or email-based (legacy fallback)
      const storedToken = existing.resumeToken || "";
      const providedToken = (req.body.resumeToken || "").trim();
      const requestEmail = (req.body.email || "").trim().toLowerCase();
      const storedEmail = (existing.email || "").trim().toLowerCase();

      if (storedToken && providedToken) {
        // Token is set and caller supplied one: verify it matches
        if (providedToken !== storedToken) {
          return res.status(403).json({ error: "Forbidden: invalid resume token" });
        }
      } else {
        // No token provided (or row has no token): fall back to email match.
        // This covers both legacy rows and applicants who never received their token
        // (e.g. created before tokenisation was introduced). The token is always
        // included in the response so the client can cache it for future requests.
        if (!requestEmail || requestEmail !== storedEmail) {
          return res.status(403).json({ error: "Forbidden: email does not match application record" });
        }
      }

      // Duplicate submission guard: if transitioning to submitted, block if:
      // (a) the application being patched is already in a non-draft state, or
      // (b) another non-draft application exists for the same email
      if (newStatus === "submitted") {
        if (existing.status !== "draft") {
          return res.status(409).json({ error: "An application from this email address has already been submitted." });
        }
        const duplicate = await storage.getSubmittedApplicationByEmail(storedEmail);
        if (duplicate && duplicate.id !== req.params.id) {
          return res.status(409).json({ error: "An application from this email address has already been submitted." });
        }
      }

      const rawPayload = req.body.email
        ? { ...req.body, email: (req.body.email as string).toLowerCase().trim() }
        : req.body;
      const updatePayload = normalizeApplicationBodyPublic(rawPayload);
      // Set submittedAt server-side when transitioning to submitted
      if (newStatus === "submitted") {
        (updatePayload as Record<string, unknown>).submittedAt = new Date();
        const applicantCohort = existing.cohortId ? await storage.getCohort(existing.cohortId) : undefined;
        const finalExtraAnswers = (updatePayload as Record<string, unknown>).extraAnswers ?? existing.extraAnswers;
        const validationError = validateExtraAnswers(applicantCohort, finalExtraAnswers as Record<string, unknown>);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }
      }
      const application = await storage.updateApplication(req.params.id, updatePayload);
      if (!application) return res.status(404).json({ error: "Application not found" });

      const applicationCohort = application.cohortId ? await storage.getCohort(application.cohortId) : undefined;
      const cohortEmailInfo = applicationCohort
        ? {
            name: applicationCohort.displayName || applicationCohort.name,
            sponsor: applicationCohort.sponsor,
            partnershipNote: applicationCohort.partnershipNote,
            slug: applicationCohort.slug,
            extraQuestions: applicationCohort.extraQuestions,
          }
        : undefined;
      const applyPath = applicationCohort ? `/apply/${applicationCohort.slug}` : "/apply";

      // When saving a draft, send a progress notification email (fire-and-forget)
      if (newStatus === "draft") {
        const stepNumber = typeof req.body.currentStep === "number" ? req.body.currentStep : 0;
        const firstName = application.firstName || existing.firstName || undefined;
        const token = application.resumeToken || existing.resumeToken;
        const baseUrl = process.env.APP_URL || "https://afaraaccelerator.org";
        const resumeUrl = token
          ? `${baseUrl}${applyPath}?token=${encodeURIComponent(token)}&email=${encodeURIComponent(application.email)}`
          : `${baseUrl}${applyPath}`;
        import("./email").then(({ sendDraftSaveNotificationEmail, getApplicationStepCount }) => {
          sendDraftSaveNotificationEmail(application.email, firstName, stepNumber, getApplicationStepCount(cohortEmailInfo), resumeUrl, cohortEmailInfo)
            .catch(err => console.error("Draft save notification email failed:", err));
        }).catch(err => console.error("Failed to import email module:", err));
      }

      // When transitioning to submitted, send confirmation email only.
      // Account provisioning is deferred until admin acceptance to avoid creating
      // accounts for unverified email addresses.
      if (newStatus === "submitted") {
        try {
          const { sendApplicationConfirmationEmail } = await import("./email");
          await sendApplicationConfirmationEmail(application.email, application.firstName, cohortEmailInfo);
        } catch (innerError) {
          console.error("Failed to send application confirmation email:", innerError);
        }
        triggerAutoEvaluate(application.id);
      }

      res.json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error in PATCH /api/applications/:id/save:", error);
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  // Admin-only: full application status management (accept, reject, waitlist, etc.)
  async function handleApplicationStatusChange(application: any, newStatus: string, reviewNotes?: string) {
    const { sendAcceptanceEmail, sendRejectionEmail, sendWaitlistEmail, sendDisqualificationEmail } = await import("./email");
    const applicationCohort = application.cohortId ? await storage.getCohort(application.cohortId) : undefined;
    const cohortEmailInfo = applicationCohort
      ? {
          name: applicationCohort.displayName || applicationCohort.name,
          sponsor: applicationCohort.sponsor,
          partnershipNote: applicationCohort.partnershipNote,
          slug: applicationCohort.slug,
          extraQuestions: applicationCohort.extraQuestions,
        }
      : undefined;
    if (newStatus === "accepted") {
      try {
        const user = await storage.getUserByEmail(application.email);
        if (user) {
          await storage.updateUser(user.id, { role: "participant" });
        } else {
          // Account provisioning deferred from submission to here so only
          // admin-verified applicants receive accounts.
          const tempPassword = randomUUID() + randomUUID();
          await createUserWithPassword(application.email, tempPassword, application.firstName, application.lastName, "participant", true);
        }
        await sendAcceptanceEmail(application.email, application.firstName, reviewNotes, cohortEmailInfo);
      } catch (err) {
        console.error("Failed to provision account or send acceptance email:", err);
      }
    } else if (newStatus === "rejected") {
      try {
        await sendRejectionEmail(application.email, application.firstName, reviewNotes, cohortEmailInfo);
      } catch (err) {
        console.error("Failed to send rejection email:", err);
      }
    } else if (newStatus === "waitlisted") {
      try {
        const user = await storage.getUserByEmail(application.email);
        if (user) await storage.updateUser(user.id, { role: "community_member" });
        await sendWaitlistEmail(application.email, application.firstName, cohortEmailInfo);
      } catch (err) {
        console.error("Failed to add to community or send waitlist email:", err);
      }
    } else if (newStatus === "disqualified") {
      try {
        await sendDisqualificationEmail(application.email, application.firstName, cohortEmailInfo);
      } catch (err) {
        console.error("Failed to send disqualification email:", err);
      }
    }
  }

  app.patch("/api/applications/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const newStatus = req.body.status;
      const reviewNotes = req.body.reviewNotes;
      const application = await storage.updateApplication(req.params.id, req.body);
      if (!application) return res.status(404).json({ error: "Application not found" });
      if (newStatus) await handleApplicationStatusChange(application, newStatus, reviewNotes);
      res.json(application);
    } catch (error) {
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  // Alias kept for backward compatibility
  app.patch("/api/admin/applications/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const newStatus = req.body.status;
      const reviewNotes = req.body.reviewNotes;
      const application = await storage.updateApplication(req.params.id, req.body);
      if (!application) return res.status(404).json({ error: "Application not found" });
      if (newStatus) await handleApplicationStatusChange(application, newStatus, reviewNotes);
      res.json(application);
    } catch (error) {
      console.error("PATCH /api/admin/applications/:id error:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  // Admin-only: translate application text fields
  app.post("/api/admin/translate", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { texts, targetLang = "en" } = req.body;
      if (!Array.isArray(texts)) return res.status(400).json({ error: "texts must be an array" });

      const translateOne = async (text: string) => {
        if (!text || text.trim().length < 3) return { translated: text, detectedLang: "en" };
        try {
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text.substring(0, 4800))}`;
          const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
          if (!r.ok) return { translated: text, detectedLang: "unknown" };
          const data = await r.json();
          const translated = Array.isArray(data[0])
            ? data[0].map((chunk: any[]) => chunk[0] ?? "").join("")
            : text;
          const detectedLang = data[2] || "unknown";
          return { translated, detectedLang };
        } catch {
          return { translated: text, detectedLang: "unknown" };
        }
      };

      const results = await Promise.all(texts.map(translateOne));
      res.json({ results });
    } catch (error) {
      console.error("Translate error:", error);
      res.status(500).json({ error: "Translation failed" });
    }
  });

  // Admin-only: delete application
  app.delete("/api/applications/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) return res.status(404).json({ error: "Application not found" });
      
      await storage.deleteApplication(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete application" });
    }
  });

  // AI Evaluation: run evaluation for a single application
  app.post("/api/admin/applications/:id/evaluate", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) return res.status(404).json({ error: "Application not found" });
      if (application.status === "draft") return res.status(400).json({ error: "Cannot evaluate a draft application" });

      const { evaluateApplication, EVAL_MODEL } = await import("./ai-evaluation");
      const result = await evaluateApplication(application);

      const evaluation = await storage.upsertApplicationEvaluation({
        applicationId: application.id,
        ...result,
        evaluatedByModel: EVAL_MODEL,
      });

      res.json(evaluation);
    } catch (error) {
      console.error("AI evaluation error:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "AI evaluation failed. Please try again." });
    }
  });

  // AI Evaluation: get existing evaluation for an application
  app.get("/api/admin/applications/:id/evaluation", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const evaluation = await storage.getApplicationEvaluation(req.params.id);
      if (!evaluation) return res.status(404).json({ error: "No evaluation found" });
      res.json(evaluation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch evaluation" });
    }
  });

  // Fire-and-forget AI evaluation triggered automatically on submission
  function triggerAutoEvaluate(applicationId: string): void {
    Promise.resolve().then(async () => {
      try {
        const { evaluateApplication, EVAL_MODEL } = await import("./ai-evaluation");
        const application = await storage.getApplication(applicationId);
        if (!application) return;
        const result = await evaluateApplication(application);
        await storage.upsertApplicationEvaluation({
          applicationId,
          ...result,
          evaluatedByModel: EVAL_MODEL,
        });
        console.log(`[auto-eval] ${applicationId} scored ${result.overallScore}`);
      } catch (err) {
        console.error(`[auto-eval] Failed for ${applicationId}:`, err instanceof Error ? err.message : err);
      }
    });
  }

  // AI Evaluation: cohort analytics data
  app.get("/api/admin/cohort-analytics", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const cohortId = typeof req.query.cohortId === "string" ? req.query.cohortId : undefined;
      const [allApps, evaluations, cohortsList] = await Promise.all([
        storage.getAllApplications(),
        storage.getAllApplicationEvaluations(),
        storage.getAllCohorts(),
      ]);
      const applications = cohortId ? allApps.filter((a) => a.cohortId === cohortId) : allApps;
      const applicationIds = new Set(applications.map((application) => application.id));
      const scopedEvaluations = cohortId
        ? evaluations.filter((evaluation) => applicationIds.has(evaluation.applicationId))
        : evaluations;
      res.json({ applications, evaluations: scopedEvaluations, cohorts: cohortsList });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cohort analytics" });
    }
  });

  // AI Evaluation: generate cohort narrative
  app.post("/api/admin/cohort-narrative", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { evaluations } = req.body;
      if (!Array.isArray(evaluations) || evaluations.length === 0) {
        return res.status(400).json({ error: "No evaluations provided" });
      }
      const { generateCohortNarrative } = await import("./ai-evaluation");
      const narrative = await generateCohortNarrative(evaluations);
      res.json({ narrative });
    } catch (error) {
      console.error("Cohort narrative error:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Failed to generate cohort narrative" });
    }
  });

  // Public: check if applications are open
  app.get("/api/cohorts/open", async (req: Request, res: Response) => {
    try {
      const cohort = await storage.getOpenCohort();
      res.json({ cohort: cohort ?? null });
    } catch {
      res.status(500).json({ error: "Failed to check open cohort" });
    }
  });

  // Public cohort payload: only fields safe/relevant to show visitors and the
  // apply flow. Internal bookkeeping (createdAt, isActive) is left out.
  function toPublicCohort(cohort: Cohort) {
    return {
      id: cohort.id,
      slug: cohort.slug,
      name: cohort.name,
      displayName: cohort.displayName,
      version: cohort.version,
      cohortType: cohort.cohortType,
      status: cohort.status,
      isOpen: cohort.isOpen,
      description: cohort.description,
      tagline: cohort.tagline,
      partnershipNote: cohort.partnershipNote,
      sponsor: cohort.sponsor,
      geography: cohort.geography,
      sector: cohort.sector,
      year: cohort.year,
      logoUrl: cohort.logoUrl,
      heroImageUrl: cohort.heroImageUrl,
      eligibilityCriteria: cohort.eligibilityCriteria,
      applicationOpenAt: cohort.applicationOpenAt,
      applicationCloseAt: cohort.applicationCloseAt,
      programStartAt: cohort.programStartAt,
      programEndAt: cohort.programEndAt,
      extraQuestions: cohort.extraQuestions ?? [],
    };
  }

  // Validate an applicant's extra-question answers against a cohort's extra
  // question definitions before allowing a final ("submitted") save. Checks
  // both that every required question is answered AND, for any answer that
  // is present, that it matches the question's type (and — for single_select
  // — one of its configured options), so a malformed direct API payload
  // can't be persisted as a "submitted" application.
  function validateExtraAnswers(cohort: Cohort | undefined, extraAnswers: Record<string, unknown> | undefined | null): string | null {
    const questions = cohort?.extraQuestions ?? [];
    if (questions.length === 0) return null;
    const answers = extraAnswers && typeof extraAnswers === "object" ? extraAnswers : {};
    for (const q of questions) {
      const value = (answers as Record<string, unknown>)[q.id];
      const isMissing =
        value === undefined || value === null || (typeof value === "string" && value.trim() === "");
      if (isMissing) {
        if (q.required) return `Please answer the required question: "${q.label}"`;
        continue;
      }
      if (q.type === "yes_no") {
        if (typeof value !== "boolean") {
          return `Invalid answer for "${q.label}": expected yes/no`;
        }
      } else if (q.type === "single_select") {
        if (typeof value !== "string" || !(q.options ?? []).includes(value)) {
          return `Invalid answer for "${q.label}": must be one of the provided options`;
        }
      } else {
        // short_text / long_text
        if (typeof value !== "string") {
          return `Invalid answer for "${q.label}": expected text`;
        }
      }
    }
    return null;
  }

  // Public: list cohorts for the public "Our Cohorts" page. Drafts (not yet
  // announced) are excluded; open cohorts are surfaced first.
  app.get("/api/cohorts", async (req: Request, res: Response) => {
    try {
      const list = await storage.getPublicCohorts();
      res.json(list.map(toPublicCohort));
    } catch {
      res.status(500).json({ error: "Failed to fetch cohorts" });
    }
  });

  // Public: resolve the default/primary cohort that bare /apply maps to.
  // Returned regardless of status so /apply can show its own closed/draft
  // experience rather than a generic one when the core cohort isn't open.
  app.get("/api/cohorts/primary", async (req: Request, res: Response) => {
    try {
      const cohort = await storage.getPrimaryCohort();
      res.json({ cohort: cohort ? toPublicCohort(cohort) : null });
    } catch {
      res.status(500).json({ error: "Failed to fetch primary cohort" });
    }
  });

  // Public: resolve a cohort by slug for /cohorts/:slug and /apply/:slug.
  // Returned regardless of status — the apply flow needs to render a
  // closed/draft experience for its own slug rather than 404ing, while the
  // public cohort detail page decides separately whether to show drafts.
  app.get("/api/cohorts/by-slug/:slug", async (req: Request, res: Response) => {
    try {
      const cohort = await storage.getCohortBySlug(req.params.slug);
      res.json({ cohort: cohort ? toPublicCohort(cohort) : null });
    } catch {
      res.status(500).json({ error: "Failed to fetch cohort" });
    }
  });

  // Admin: open or close a cohort. Cohorts open/close independently — multiple
  // cohorts (e.g. AFARA CORE and DOREWA) can be open for applications at once.
  app.post("/api/admin/cohorts/:id/set-open", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { open } = req.body;
      const cohort = await storage.setOpenCohort(req.params.id, !!open);
      if (!cohort) return res.status(404).json({ error: "Cohort not found" });
      res.json(cohort);
    } catch {
      res.status(500).json({ error: "Failed to update cohort open status" });
    }
  });

  // Cohort CRUD
  app.get("/api/admin/cohorts", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const list = await storage.getAllCohorts();
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cohorts" });
    }
  });

  function slugify(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-+|-+$)/g, "");
  }

  const cohortDateFields = ["applicationOpenAt", "applicationCloseAt", "programStartAt", "programEndAt"] as const;

  function coerceCohortBody(body: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = { ...body };
    if (typeof out.year === "string" && out.year.trim() !== "") out.year = Number(out.year);
    if (out.year === "") out.year = undefined;
    for (const field of cohortDateFields) {
      const val = out[field];
      if (typeof val === "string" && val.trim() !== "") out[field] = new Date(val);
      else if (val === "" || val === null) out[field] = null;
    }
    return out;
  }

  app.post("/api/admin/cohorts", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const body = coerceCohortBody(req.body);
      if (!body.slug && typeof body.name === "string") {
        body.slug = slugify(body.name);
      }
      const parsed = insertCohortSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid cohort data" });
      }
      const existing = await storage.getCohortBySlug(parsed.data.slug);
      if (existing) {
        return res.status(409).json({ error: `A cohort with slug "${parsed.data.slug}" already exists` });
      }
      const cohort = await storage.createCohort(parsed.data);
      res.status(201).json(cohort);
    } catch (error) {
      res.status(500).json({ error: "Failed to create cohort" });
    }
  });

  app.patch("/api/admin/cohorts/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const body = coerceCohortBody(req.body);
      const parsed = insertCohortSchema.partial().safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid cohort data" });
      }
      if (parsed.data.slug) {
        const existing = await storage.getCohortBySlug(parsed.data.slug);
        if (existing && existing.id !== req.params.id) {
          return res.status(409).json({ error: `A cohort with slug "${parsed.data.slug}" already exists` });
        }
      }
      const cohort = await storage.updateCohort(req.params.id, parsed.data);
      if (!cohort) return res.status(404).json({ error: "Cohort not found" });
      res.json(cohort);
    } catch (error) {
      res.status(500).json({ error: "Failed to update cohort" });
    }
  });

  // Duplicate a cohort into a new edition (e.g. "DOREWA" -> "DOREWA 2.0")
  app.post("/api/admin/cohorts/:id/duplicate", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const body = coerceCohortBody(req.body || {});
      const overrides: Record<string, unknown> = { ...body };
      if (!overrides.slug && typeof overrides.name === "string") {
        overrides.slug = slugify(overrides.name as string);
      }
      const parsedOverrides = insertCohortSchema.partial().safeParse(overrides);
      if (!parsedOverrides.success) {
        return res.status(400).json({ error: parsedOverrides.error.issues[0]?.message || "Invalid cohort data" });
      }
      if (!parsedOverrides.data.slug) {
        return res.status(400).json({ error: "A new slug is required to duplicate a cohort" });
      }
      const slugTaken = await storage.getCohortBySlug(parsedOverrides.data.slug);
      if (slugTaken) {
        return res.status(409).json({ error: `A cohort with slug "${parsedOverrides.data.slug}" already exists` });
      }
      const cohort = await storage.duplicateCohort(req.params.id, parsedOverrides.data);
      if (!cohort) return res.status(404).json({ error: "Cohort not found" });
      res.status(201).json(cohort);
    } catch (error) {
      res.status(500).json({ error: "Failed to duplicate cohort" });
    }
  });

  // Preview how a cohort's sponsor/partnershipNote branding renders in the
  // confirmation and draft-save applicant emails, without sending anything —
  // lets an admin catch a typo or awkward partnership note before applicants
  // ever receive it.
  app.get("/api/admin/cohorts/:id/email-preview", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const cohort = await storage.getCohort(req.params.id);
      if (!cohort) return res.status(404).json({ error: "Cohort not found" });
      const type = typeof req.query.type === "string" ? req.query.type : "confirmation";
      const { renderApplicationConfirmationEmailPreview, renderDraftSaveNotificationEmailPreview } = await import("./email");
      let preview: { subject: string; html: string };
      if (type === "confirmation") preview = renderApplicationConfirmationEmailPreview(cohort);
      else if (type === "draft-save") preview = renderDraftSaveNotificationEmailPreview(cohort);
      else return res.status(400).json({ error: "Unknown type. Use: confirmation | draft-save" });
      res.json(preview);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to render email preview" });
    }
  });

  app.delete("/api/admin/cohorts/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      await storage.deleteCohort(req.params.id);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete cohort" });
    }
  });

  // Assign an application to a cohort (or remove it)
  app.patch("/api/admin/applications/:id/cohort", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) return res.status(404).json({ error: "Application not found" });
      const cohortId = req.body.cohortId || null;
      if (cohortId) {
        const cohort = await storage.getCohort(cohortId);
        if (!cohort) return res.status(404).json({ error: "Cohort not found" });
      }
      await storage.assignApplicationToCohort(req.params.id, cohortId);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to assign cohort" });
    }
  });

  // Batch evaluate all unevaluated submitted applications (optionally scoped to a cohort)
  app.post("/api/admin/cohort-analytics/evaluate-all", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { cohortId, force } = req.body;
      let allApps = await storage.getAllApplications();

      // When not forcing, only consider submitted (non-draft) applications
      if (!force) {
        const submittedStatuses = ["submitted", "under_review", "accepted", "rejected", "waitlisted", "disqualified"];
        allApps = allApps.filter((a) => submittedStatuses.includes(a.status));
      }

      if (cohortId) {
        allApps = allApps.filter((a) => a.cohortId === cohortId);
      }

      let toEvaluate = allApps;
      if (!force) {
        const allEvals = await storage.getAllApplicationEvaluations();
        const evaluatedIds = new Set(allEvals.map((e) => e.applicationId));
        toEvaluate = allApps.filter((a) => !evaluatedIds.has(a.id));
      }

      if (toEvaluate.length === 0) {
        return res.json({ evaluated: 0, total: 0, message: "No submitted applications found" });
      }

      const { evaluateApplication, EVAL_MODEL } = await import("./ai-evaluation");
      const pLimit = (await import("p-limit")).default;
      const limit = pLimit(3);

      let evaluated = 0;
      const errors: string[] = [];
      await Promise.all(
        toEvaluate.map((app) =>
          limit(async () => {
            try {
              const result = await evaluateApplication(app);
              await storage.upsertApplicationEvaluation({
                applicationId: app.id,
                ...result,
                evaluatedByModel: EVAL_MODEL,
              });
              evaluated++;
            } catch (err) {
              errors.push(`${app.id}: ${err instanceof Error ? err.message : "unknown"}`);
            }
          })
        )
      );

      res.json({ evaluated, total: toEvaluate.length, errors: errors.length > 0 ? errors : undefined });
    } catch (error) {
      console.error("Batch evaluation error:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Batch evaluation failed" });
    }
  });

  // Newsletter Routes
  const subscribeSchema = z.object({
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    source: z.string().optional()
  });

  const unsubscribeSchema = z.object({
    email: z.string().email()
  });

  const newsletterBlockSchema = z.discriminatedUnion("type", [
    z.object({ id: z.string().min(1), type: z.literal("text"), text: z.string().max(20000) }),
    z.object({ id: z.string().min(1), type: z.literal("image"), url: z.string().trim().min(1).max(2000), alt: z.string().max(300) }),
    z.object({ id: z.string().min(1), type: z.literal("button"), label: z.string().trim().min(1).max(200), url: z.string().trim().min(1).max(2000) }),
    z.object({ id: z.string().min(1), type: z.literal("divider") }),
  ]);
  const newsletterAudienceSchema = z.object({
    segments: z.array(z.discriminatedUnion("type", [
      z.object({ type: z.literal("newsletter_subscribers") }),
      z.object({ type: z.literal("community_members") }),
      z.object({ type: z.literal("team_members") }),
      z.object({ type: z.literal("all_users") }),
      z.object({ type: z.literal("cohort_members"), cohortId: z.string().min(1) }),
      z.object({ type: z.literal("applicants"), status: z.enum(["submitted", "under_review", "accepted", "rejected", "waitlisted", "disqualified"]), cohortId: z.string().min(1).optional() }),
    ])).default([]),
    selectedUserIds: z.array(z.string().min(1)).default([]),
  });
  const campaignSchema = z.object({
    subject: z.string().min(1, "Subject is required"),
    content: z.string().optional(),
    blocks: z.array(newsletterBlockSchema).min(1).optional(),
    audience: newsletterAudienceSchema.default({ segments: [], selectedUserIds: [] }),
  }).superRefine((campaign, ctx) => {
    if (!campaign.content && !campaign.blocks?.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["content"], message: "Content is required" });
    }
    if (!campaign.audience.segments.length && !campaign.audience.selectedUserIds.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["audience"], message: "Choose at least one recipient group" });
    }
  });

  const isAdmin = (req: Request): boolean => {
    const role = req.session?.userRole;
    return role === "admin" || role === "superadmin";
  };

  const resolveNewsletterRecipients = async (audience: NewsletterAudience) => {
    const allUsers = await storage.getAllUsers();
    const usersById = new Map(allUsers.map((user) => [user.id, user]));
    const usersByEmail = new Map(allUsers.map((user) => [user.email.toLowerCase(), user]));
    const recipients = new Map<string, {
      id?: string;
      email: string;
      firstName?: string;
      lastName?: string;
      sources: string[];
    }>();
    const addRecipient = (email: string, firstName: string | null | undefined, lastName: string | null | undefined, source: string, userId?: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !normalizedEmail.includes("@")) return;
      const existing = recipients.get(normalizedEmail);
      if (existing) {
        if (!existing.sources.includes(source)) existing.sources.push(source);
        return;
      }
      recipients.set(normalizedEmail, {
        id: userId,
        email: normalizedEmail,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        sources: [source],
      });
    };

    for (const segment of audience.segments) {
      if (segment.type === "newsletter_subscribers") {
        const subscribers = await storage.getActiveNewsletterSubscribers();
        subscribers.forEach((subscriber) => addRecipient(subscriber.email, subscriber.firstName, subscriber.lastName, "Newsletter subscribers", usersByEmail.get(subscriber.email.toLowerCase())?.id));
      } else if (segment.type === "community_members") {
        allUsers.filter((user) => user.isActive && user.role === "community_member")
          .forEach((user) => addRecipient(user.email, user.firstName, user.lastName, "Community members", user.id));
      } else if (segment.type === "team_members") {
        const teamRoles = new Set(["mentor", "facilitator", "admin", "superadmin"]);
        allUsers.filter((user) => user.isActive && teamRoles.has(user.role))
          .forEach((user) => addRecipient(user.email, user.firstName, user.lastName, "Team members", user.id));
      } else if (segment.type === "all_users") {
        allUsers.filter((user) => user.isActive)
          .forEach((user) => addRecipient(user.email, user.firstName, user.lastName, "All active users", user.id));
      } else if (segment.type === "cohort_members") {
        const applications = (await storage.getApplicationsByStatus("accepted"))
          .filter((application) => application.cohortId === segment.cohortId);
        applications.forEach((application) => {
          const user = usersByEmail.get(application.email.toLowerCase());
          addRecipient(application.email, application.firstName, application.lastName, "Cohort members", user?.id);
        });
      } else if (segment.type === "applicants") {
        const applications = (await storage.getApplicationsByStatus(segment.status))
          .filter((application) => !segment.cohortId || application.cohortId === segment.cohortId);
        applications.forEach((application) => {
          const user = usersByEmail.get(application.email.toLowerCase());
          addRecipient(application.email, application.firstName, application.lastName, `Applicants · ${segment.status}`, user?.id);
        });
      }
    }

    audience.selectedUserIds.forEach((userId) => {
      const user = usersById.get(userId);
      if (user?.isActive) addRecipient(user.email, user.firstName, user.lastName, "Selected people", user.id);
    });
    return Array.from(recipients.values()).sort((a, b) => a.email.localeCompare(b.email));
  };

  const buildNewsletterHtml = (subject: string, content: string | undefined, blocks: NewsletterBlock[] | undefined) =>
    blocks?.length ? renderNewsletterHtml(subject, blocks) : content || "";

  app.get("/api/newsletter/recipient-options", async (req: Request, res: Response) => {
    if (!req.session?.userId || !isAdmin(req)) return res.status(403).json({ error: "Admin access required" });
    try {
      const cohorts = await storage.getAllCohorts();
      const users = (await storage.getAllUsers())
        .filter((user) => user.isActive)
        .map((user) => ({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role }));
      const statuses = ["submitted", "under_review", "accepted", "rejected", "waitlisted", "disqualified"];
      const groupDefinitions: Array<{ key: NewsletterAudience["segments"][number]["type"]; label: string; description: string; audience: NewsletterAudience }> = [
        { key: "newsletter_subscribers", label: "Newsletter subscribers", description: "People who opted into the public newsletter.", audience: { segments: [{ type: "newsletter_subscribers" }], selectedUserIds: [] } },
        { key: "community_members", label: "Community members", description: "Active users with the community member role.", audience: { segments: [{ type: "community_members" }], selectedUserIds: [] } },
        { key: "team_members", label: "Team members", description: "Mentors, facilitators, admins, and super admins.", audience: { segments: [{ type: "team_members" }], selectedUserIds: [] } },
        { key: "all_users", label: "All active users", description: "Every active platform account.", audience: { segments: [{ type: "all_users" }], selectedUserIds: [] } },
      ];
      const groups = await Promise.all(groupDefinitions.map(async (group) => ({ key: group.key, label: group.label, description: group.description, count: (await resolveNewsletterRecipients(group.audience)).length })));
      res.json({ groups, cohorts: await Promise.all(cohorts.map(async (cohort) => ({ id: cohort.id, name: cohort.displayName || cohort.name, count: (await resolveNewsletterRecipients({ segments: [{ type: "cohort_members", cohortId: cohort.id }], selectedUserIds: [] })).length }))), applicantStatuses: statuses, users });
    } catch (error) {
      console.error("Recipient options error:", error);
      res.status(500).json({ error: "Failed to load recipient options" });
    }
  });

  app.post("/api/newsletter/recipient-preview", async (req: Request, res: Response) => {
    if (!req.session?.userId || !isAdmin(req)) return res.status(403).json({ error: "Admin access required" });
    try {
      const audience = newsletterAudienceSchema.parse(req.body.audience || DEFAULT_NEWSLETTER_AUDIENCE) as NewsletterAudience;
      const recipients = await resolveNewsletterRecipients(audience);
      res.json({ count: recipients.length, recipients: recipients.slice(0, 500) });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      res.status(500).json({ error: "Failed to preview recipients" });
    }
  });

  app.post("/api/contact", async (req: Request, res: Response) => {
    const { name, email, organization, interest, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required" });
    }
    try {
      const { sendContactNotificationEmail } = await import("./email");
      await sendContactNotificationEmail({ name, email, organization, interest, message });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.get("/api/newsletter/subscribers", async (req: Request, res: Response) => {
    if (!req.session?.userId || !isAdmin(req)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const subscribers = await storage.getAllNewsletterSubscribers();
      res.json(subscribers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscribers" });
    }
  });

  app.post("/api/newsletter/subscribe", async (req: Request, res: Response) => {
    try {
      const { email, firstName, lastName, source } = subscribeSchema.parse(req.body);
      
      const existingSubscriber = await storage.getNewsletterSubscriberByEmail(email);
      
      if (existingSubscriber) {
        if (existingSubscriber.isActive) {
          return res.status(400).json({ error: "Email is already subscribed" });
        }
        const resubscribed = await storage.updateNewsletterSubscriber(existingSubscriber.id, {
          isActive: true,
          firstName,
          lastName
        });
        try {
          const { sendWelcomeEmail } = await import("./email");
          await sendWelcomeEmail(email, firstName);
        } catch (emailError) {
          console.error("Failed to send welcome email on resubscribe:", emailError);
        }
        return res.json({ message: "Successfully resubscribed", subscriber: resubscribed });
      }
      
      const subscriber = await storage.createNewsletterSubscriber({
        email,
        firstName,
        lastName,
        source: source || "website"
      });
      
      try {
        const { sendWelcomeEmail } = await import("./email");
        await sendWelcomeEmail(email, firstName);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }
      
      res.status(201).json({ message: "Successfully subscribed", subscriber });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Subscribe error:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  app.post("/api/newsletter/unsubscribe", async (req: Request, res: Response) => {
    try {
      const { email } = unsubscribeSchema.parse(req.body);
      await storage.unsubscribeNewsletter(email);
      res.json({ message: "Successfully unsubscribed" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  app.get("/api/newsletter/campaigns", async (req: Request, res: Response) => {
    if (!req.session?.userId || !isAdmin(req)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const campaigns = await storage.getAllNewsletterCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/newsletter/campaigns", async (req: Request, res: Response) => {
    if (!req.session?.userId || !isAdmin(req)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const parsed = campaignSchema.parse(req.body);
      const content = buildNewsletterHtml(parsed.subject, parsed.content, parsed.blocks as NewsletterBlock[] | undefined);
      
      const campaign = await storage.createNewsletterCampaign({
        subject: parsed.subject,
        content,
        contentJson: parsed.blocks as NewsletterBlock[] | undefined,
        audienceJson: parsed.audience as NewsletterAudience,
        sentById: req.session.userId,
        status: "draft"
      });
      
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  app.patch("/api/newsletter/campaigns/:id", async (req: Request, res: Response) => {
    if (!req.session?.userId || !isAdmin(req)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const campaign = await storage.getNewsletterCampaign(req.params.id);
      if (!campaign) return res.status(404).json({ error: "Campaign not found" });
      if (campaign.status !== "draft") return res.status(400).json({ error: "Sent campaigns cannot be edited" });
      const parsed = campaignSchema.parse(req.body);
      const updated = await storage.updateNewsletterCampaign(campaign.id, {
        subject: parsed.subject,
        content: buildNewsletterHtml(parsed.subject, parsed.content, parsed.blocks as NewsletterBlock[] | undefined),
        contentJson: parsed.blocks as NewsletterBlock[] | undefined,
        audienceJson: parsed.audience as NewsletterAudience,
      });
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  app.post("/api/newsletter/preview", async (req: Request, res: Response) => {
    if (!req.session?.userId || !isAdmin(req)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const parsed = campaignSchema.parse({
        ...req.body,
        audience: req.body.audience || DEFAULT_NEWSLETTER_AUDIENCE,
      });
      res.json({ subject: parsed.subject, html: buildNewsletterHtml(parsed.subject, parsed.content, parsed.blocks as NewsletterBlock[] | undefined) });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      res.status(500).json({ error: "Failed to build preview" });
    }
  });

  app.post("/api/newsletter/test", async (req: Request, res: Response) => {
    if (!req.session?.userId || !isAdmin(req)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const recipientEmail = z.string().email().parse(req.body.recipientEmail);
      const parsed = campaignSchema.parse({
        ...req.body,
        audience: req.body.audience || DEFAULT_NEWSLETTER_AUDIENCE,
      });
      const html = buildNewsletterHtml(parsed.subject, parsed.content, parsed.blocks as NewsletterBlock[] | undefined);
      const { sendNewsletter } = await import("./email");
      const result = await sendNewsletter(parsed.subject, html, [recipientEmail]);
      if (!result.success) return res.status(502).json({ error: result.error || "Failed to send test email" });
      if (req.body.campaignId) {
        const campaign = await storage.getNewsletterCampaign(req.body.campaignId);
        if (campaign?.status === "draft") await storage.updateNewsletterCampaign(campaign.id, { lastTestSentAt: new Date() });
      }
      res.json({ message: "Test email sent", recipientEmail });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      console.error("Test newsletter error:", error);
      res.status(500).json({ error: "Failed to send test email" });
    }
  });

  app.post("/api/newsletter/campaigns/:id/send", async (req: Request, res: Response) => {
    if (!req.session?.userId || !isAdmin(req)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const campaign = await storage.getNewsletterCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      if (campaign.status !== "draft") return res.status(400).json({ error: "This campaign has already been sent or is not ready to send" });
      const audience = (campaign.audienceJson || DEFAULT_NEWSLETTER_AUDIENCE) as NewsletterAudience;
      const recipients = await resolveNewsletterRecipients(audience);
      const recipientEmails = recipients.map((recipient) => recipient.email);
      if (recipientEmails.length === 0) {
        return res.status(400).json({ error: "No recipients match the selected groups" });
      }
      const html = buildNewsletterHtml(campaign.subject, campaign.content, campaign.contentJson as NewsletterBlock[] | undefined);
      const { sendNewsletter } = await import("./email");
      const result = await sendNewsletter(campaign.subject, html, recipientEmails);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to send newsletter" });
      }
      
      await storage.updateNewsletterCampaign(campaign.id, {
        status: "sent",
        recipientCount: recipientEmails.length,
        sentAt: new Date(),
      });
      
      res.json({ message: "Newsletter sent successfully", recipientCount: recipientEmails.length });
    } catch (error) {
      console.error("Send campaign error:", error);
      res.status(500).json({ error: "Failed to send campaign" });
    }
  });

  // Avatar upload endpoint
  const avatarUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB
    fileFilter: (_req, file, cb) => {
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
      }
    },
  });

  app.post(
    "/api/auth/upload-avatar",
    requireAuth,
    (req: Request, res: Response, next: NextFunction) => {
      avatarUpload.single("avatar")(req, res, (err) => {
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File exceeds 4 MB limit. Please upload a smaller file." });
        }
        if (err) {
          return res.status(400).json({ error: err.message || "Upload error" });
        }
        next();
      });
    },
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file provided" });
        }

        const userId = req.session.userId!;
        const ext = req.file.mimetype === "image/png"
          ? "png"
          : req.file.mimetype === "image/webp"
          ? "webp"
          : "jpg";
        const key = `avatars/${userId}.${ext}`;

        const { isR2Configured, uploadFile } = await import("./r2-storage");

        let avatarUrl: string;
        if (isR2Configured()) {
          const result = await uploadFile(key, req.file.buffer, req.file.mimetype, true);
          avatarUrl = result.url;
        } else {
          const base64 = req.file.buffer.toString("base64");
          avatarUrl = `data:${req.file.mimetype};base64,${base64}`;
        }

        const updated = await storage.updateUser(userId, { profileImageUrl: avatarUrl });
        if (!updated) {
          return res.status(404).json({ error: "User not found" });
        }

        const { passwordHash, ...safeUser } = updated;
        res.json({ user: safeUser });
      } catch (error) {
        console.error("Avatar upload error:", error);
        res.status(500).json({ error: "Failed to upload avatar" });
      }
    }
  );

  const httpServer = createServer(app);

  return httpServer;
}
