import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ZOOM_OAUTH_AUTHORIZE_URL = "https://zoom.us/oauth/authorize";
const ZOOM_OAUTH_TOKEN_URL = "https://zoom.us/oauth/token";
const ZOOM_API_BASE_URL = "https://api.zoom.us/v2";

export interface ZoomRecordingDownloadInput {
  downloadUrl: string;
  downloadToken?: string | null;
}

export interface ZoomRecordingDownload {
  body: Buffer;
  contentType: string;
  fileSize: number;
}

export interface ZoomOAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  scope?: string;
}

export interface ZoomMeetingInput {
  topic: string;
  agenda?: string | null;
  startTime: Date;
  endTime?: Date | null;
  durationMinutes?: number | null;
}

export interface ZoomMeeting {
  id: string;
  joinUrl: string;
  startTime?: string;
  durationMinutes?: number;
}

export interface ZoomUser {
  id?: string;
  email?: string;
}

function getErrorText(value: unknown): string {
  if (typeof value === "object" && value !== null && "message" in value) {
    return String((value as { message: unknown }).message);
  }
  return "Zoom request failed.";
}

function getZoomCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Zoom OAuth credentials are not configured.");
  }
  return { clientId, clientSecret };
}

function getEncryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured.");
  return createHash("sha256").update(secret).digest();
}

export function encryptZoomToken(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64url"), authTag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptZoomToken(value: string): string {
  const [ivValue, authTagValue, encryptedValue] = value.split(".");
  if (!ivValue || !authTagValue || !encryptedValue) {
    throw new Error("Stored Zoom token is invalid.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function getZoomAuthorizationUrl(redirectUri: string, state: string): string {
  const { clientId } = getZoomCredentials();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });
  return `${ZOOM_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

async function requestZoomOAuthToken(params: URLSearchParams): Promise<ZoomOAuthTokens> {
  const { clientId, clientSecret } = getZoomCredentials();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(ZOOM_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(`Zoom OAuth request failed (${response.status}): ${getErrorText(body)}`);
  }
  if (typeof body.access_token !== "string" || typeof body.refresh_token !== "string") {
    throw new Error("Zoom OAuth did not return usable tokens.");
  }
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresInSeconds: typeof body.expires_in === "number" ? body.expires_in : 3600,
    scope: typeof body.scope === "string" ? body.scope : undefined,
  };
}

export async function exchangeZoomAuthorizationCode(
  code: string,
  redirectUri: string,
): Promise<ZoomOAuthTokens> {
  return requestZoomOAuthToken(new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  }));
}

export async function refreshZoomAccessToken(refreshToken: string): Promise<ZoomOAuthTokens> {
  return requestZoomOAuthToken(new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  }));
}

async function zoomApiRequest<T>(
  accessToken: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`${ZOOM_API_BASE_URL}${path}`, { ...init, headers });
  const body = await response.json().catch(() => ({})) as unknown;
  if (!response.ok) {
    throw new Error(`Zoom API request failed (${response.status}): ${getErrorText(body)}`);
  }
  return body as T;
}

export async function getZoomUser(accessToken: string): Promise<ZoomUser> {
  const body = await zoomApiRequest<{ id?: unknown; email?: unknown }>(accessToken, "/users/me");
  return {
    id: typeof body.id === "string" ? body.id : undefined,
    email: typeof body.email === "string" ? body.email : undefined,
  };
}

function getMeetingDurationMinutes(input: ZoomMeetingInput): number {
  if (input.endTime) {
    const minutes = Math.round((input.endTime.getTime() - input.startTime.getTime()) / 60000);
    if (minutes > 0) return Math.min(minutes, 1440);
  }
  return Math.min(Math.max(Math.round(input.durationMinutes || 60), 1), 1440);
}

function buildMeetingPayload(input: ZoomMeetingInput): Record<string, unknown> {
  return {
    topic: input.topic,
    type: 2,
    start_time: input.startTime.toISOString(),
    duration: getMeetingDurationMinutes(input),
    timezone: "UTC",
    agenda: input.agenda || undefined,
    settings: {
      join_before_host: false,
      waiting_room: true,
      auto_recording: "cloud",
    },
  };
}

function parseZoomMeeting(body: { id?: unknown; join_url?: unknown; start_time?: unknown; duration?: unknown }): ZoomMeeting {
  if ((typeof body.id !== "string" && typeof body.id !== "number") || typeof body.join_url !== "string") {
    throw new Error("Zoom did not return a usable meeting join URL.");
  }
  return {
    id: String(body.id),
    joinUrl: body.join_url,
    startTime: typeof body.start_time === "string" ? body.start_time : undefined,
    durationMinutes: typeof body.duration === "number" ? body.duration : undefined,
  };
}

export async function createZoomMeeting(
  accessToken: string,
  input: ZoomMeetingInput,
): Promise<ZoomMeeting> {
  const body = await zoomApiRequest<{ id?: unknown; join_url?: unknown; start_time?: unknown; duration?: unknown }>(
    accessToken,
    "/users/me/meetings",
    { method: "POST", body: JSON.stringify(buildMeetingPayload(input)) },
  );
  return parseZoomMeeting(body);
}

export async function updateZoomMeeting(
  accessToken: string,
  meetingId: string,
  input: ZoomMeetingInput,
): Promise<ZoomMeeting> {
  await zoomApiRequest<unknown>(
    accessToken,
    `/meetings/${encodeURIComponent(meetingId)}`,
    { method: "PATCH", body: JSON.stringify(buildMeetingPayload(input)) },
  );
  const body = await zoomApiRequest<{ id?: unknown; join_url?: unknown; start_time?: unknown; duration?: unknown }>(
    accessToken,
    `/meetings/${encodeURIComponent(meetingId)}`,
  );
  return parseZoomMeeting(body);
}

export async function deleteZoomMeeting(accessToken: string, meetingId: string): Promise<void> {
  await zoomApiRequest<unknown>(
    accessToken,
    `/meetings/${encodeURIComponent(meetingId)}`,
    { method: "DELETE" },
  );
}

function assertZoomDownloadUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Zoom returned an invalid recording download URL.");
  }
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || (hostname !== "zoom.us" && !hostname.endsWith(".zoom.us"))) {
    throw new Error("Zoom returned an untrusted recording download URL.");
  }
  return url;
}

async function getZoomAccessToken(): Promise<string> {
  // A short-lived token can be supplied by a deployment that manages Zoom
  // access outside of the server-to-server OAuth flow.
  if (process.env.ZOOM_ACCESS_TOKEN) return process.env.ZOOM_ACCESS_TOKEN;

  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  if (!clientId || !clientSecret || !accountId) {
    throw new Error("Zoom recording download credentials are not configured.");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(
    `${ZOOM_OAUTH_TOKEN_URL}?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Zoom access token request failed (${response.status}).`);
  }
  const body = await response.json() as { access_token?: unknown };
  if (typeof body.access_token !== "string" || !body.access_token) {
    throw new Error("Zoom did not return an access token.");
  }
  return body.access_token;
}

export async function downloadZoomRecording(
  input: ZoomRecordingDownloadInput,
): Promise<ZoomRecordingDownload> {
  const url = assertZoomDownloadUrl(input.downloadUrl);
  const token = input.downloadToken || await getZoomAccessToken();
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "video/mp4,application/octet-stream",
    },
  });
  if (!response.ok) {
    throw new Error(`Zoom recording download failed (${response.status}).`);
  }

  const body = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type")?.split(";")[0].trim() || "video/mp4";
  return {
    body,
    contentType: contentType.startsWith("video/") ? contentType : "video/mp4",
    fileSize: body.length,
  };
}