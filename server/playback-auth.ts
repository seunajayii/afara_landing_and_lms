import { createHmac, timingSafeEqual } from "crypto";

export interface PlaybackResource {
  resourceType: string;
  visibility: string | null;
  status: string;
}

export interface PlaybackUser {
  id: string;
  role: string;
  isActive: boolean;
  mustChangePassword?: boolean | null;
}

export interface PlaybackToken {
  resourceId: string;
  userId: string | null;
  expiresAt: number;
}

export type PlaybackAuthorization =
  | { status: 200; userId: string | null }
  | { status: 401 }
  | { status: 403 }
  | { status: 404 };

export function canAccessVisibility(
  visibility: string | null,
  userRole: string | null,
): boolean {
  const value = visibility || "community";
  if (value === "public") return true;
  if (value === "community") return userRole !== null;
  if (value === "cohort_only") {
    return userRole !== null && userRole !== "community_member";
  }
  return false;
}

export function resourceIsRestricted(resource: Pick<PlaybackResource, "resourceType" | "visibility">): boolean {
  return resource.resourceType === "video" && resource.visibility !== "public";
}

export function authorizePlayback(
  resource: PlaybackResource,
  sessionUserId: string | null | undefined,
  sessionUser: PlaybackUser | undefined,
): PlaybackAuthorization {
  if (
    sessionUserId &&
    (!sessionUser || sessionUser.id !== sessionUserId || !sessionUser.isActive)
  ) {
    return { status: 401 };
  }
  if (sessionUser?.mustChangePassword) return { status: 403 };

  const userRole = sessionUser?.role || null;
  const isAdminUser = userRole === "admin" || userRole === "superadmin";
  if (!isAdminUser && resource.status !== "published") return { status: 404 };
  if (!isAdminUser && !canAccessVisibility(resource.visibility, userRole)) {
    return { status: 403 };
  }
  if (resourceIsRestricted(resource) && !sessionUserId) {
    return { status: 403 };
  }

  return { status: 200, userId: sessionUserId || null };
}

export function isPlaybackTokenAuthorized(
  resource: Pick<PlaybackResource, "resourceType" | "visibility">,
  token: PlaybackToken,
  sessionUserId: string | null | undefined,
): boolean {
  return !resourceIsRestricted(resource) || (
    Boolean(sessionUserId) && token.userId === sessionUserId
  );
}

export function createPlaybackToken(
  resourceId: string,
  userId: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  ttlSeconds = 15 * 60,
): string {
  const payload = Buffer.from(JSON.stringify({
    resourceId,
    userId,
    expiresAt: nowSeconds + ttlSeconds,
  })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function readPlaybackToken(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): PlaybackToken | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!payload || !signature) return null;

  const expected = createHmac("sha256", secret).update(payload).digest();
  let received: Buffer;
  try {
    received = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      resourceId?: unknown;
      userId?: unknown;
      expiresAt?: unknown;
    };
    if (
      typeof parsed.resourceId !== "string" ||
      (parsed.userId !== null && typeof parsed.userId !== "string") ||
      typeof parsed.expiresAt !== "number" ||
      !Number.isFinite(parsed.expiresAt) ||
      parsed.expiresAt <= nowSeconds
    ) {
      return null;
    }
    return {
      resourceId: parsed.resourceId,
      userId: parsed.userId as string | null,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}