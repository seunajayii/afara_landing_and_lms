import assert from "node:assert/strict";
import express from "express";
import test from "node:test";
import type { Server } from "node:http";

import { registerRoutes } from "./routes";
import { encryptZoomToken } from "./zoom";
import { storage } from "./storage";

const adminId = "zoom-event-admin";
type StorageMethod = (...args: any[]) => any;
type ReplaceStorage = (name: string, implementation: StorageMethod) => void;
type FetchHandler = (url: string, init: RequestInit) => Response | Promise<Response>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "event-1",
    title: "Funding workshop",
    description: "Learn about funding opportunities.",
    eventType: "workshop",
    hostId: null,
    thumbnailUrl: null,
    startTime: new Date("2026-09-10T10:00:00.000Z"),
    endTime: new Date("2026-09-10T11:00:00.000Z"),
    durationMinutes: 60,
    meetingPlatform: "Zoom",
    meetingLink: "https://zoom.us/j/old-meeting",
    zoomMeetingId: "zoom-123",
    recordingUrl: null,
    recordingResourceId: null,
    recordingLessonId: null,
    maxAttendees: null,
    isPublic: true,
    visibility: "community",
    status: "published",
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    ...overrides,
  };
}

function makeCreateBody() {
  return {
    title: "Funding workshop",
    description: "Learn about funding opportunities.",
    eventType: "workshop",
    startTime: "2026-09-10T10:00:00.000Z",
    endTime: "2026-09-10T11:00:00.000Z",
    durationMinutes: 60,
    meetingPlatform: "Zoom",
    meetingLink: null,
    zoomMeetingId: null,
    visibility: "community",
    status: "published",
    isPublic: true,
  };
}

function makeConnection(expired = false) {
  return {
    accessToken: encryptZoomToken("zoom-access-token"),
    refreshToken: encryptZoomToken("zoom-refresh-token"),
    accessTokenExpiresAt: new Date(Date.now() + (expired ? -60_000 : 60 * 60_000)),
    scope: "meeting:write",
    zoomUserId: null,
    zoomUserEmail: null,
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
  };
}

async function withEventRoutes<T>(
  configureStorage: (replace: ReplaceStorage, sessionSecret: string) => void,
  handleFetch: FetchHandler,
  callback: (baseUrl: string) => Promise<T>,
): Promise<T> {
  const mutableStorage = storage as unknown as Record<string, StorageMethod>;
  const originalMethods = new Map<string, StorageMethod | undefined>();
  const replace: ReplaceStorage = (name, implementation) => {
    if (!originalMethods.has(name)) originalMethods.set(name, mutableStorage[name]);
    mutableStorage[name] = implementation;
  };
  const originalFetch = globalThis.fetch;
  const originalSessionSecret = process.env.SESSION_SECRET;
  const sessionSecret = originalSessionSecret || "zoom-event-test-session-secret";
  process.env.SESSION_SECRET = sessionSecret;

  replace("getUser", async () => ({
    id: adminId,
    isActive: true,
    mustChangePassword: false,
  }));
  replace("getExpiredPrivateVideoUploads", async () => []);
  replace("getPrivateVideoUploads", async () => []);
  replace("getEventRegistrationsByEvent", async () => []);
  configureStorage(replace, sessionSecret);

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.startsWith("http://127.0.0.1:")) {
      return originalFetch(input, init);
    }
    return handleFetch(url, init || {});
  };

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).session = {
      userId: adminId,
      userRole: "admin",
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
    globalThis.fetch = originalFetch;
    if (originalSessionSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = originalSessionSecret;
    for (const [name, implementation] of originalMethods) {
      if (implementation) mutableStorage[name] = implementation;
      else delete mutableStorage[name];
    }
  }
}

async function request(
  baseUrl: string,
  method: "POST" | "PATCH",
  path: string,
  body: Record<string, unknown>,
) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

test("creating a blank Zoom event stores the provider meeting ID and join URL", async () => {
  let createdData: Record<string, unknown> | undefined;
  const apiCalls: Array<{ method: string; url: string; body?: Record<string, unknown> }> = [];

  await withEventRoutes(
    replace => {
      replace("getZoomOAuthConnection", async () => makeConnection());
      replace("createEvent", async (data: Record<string, unknown>) => {
        createdData = data;
        return makeEvent(data);
      });
    },
    async (url, init) => {
      apiCalls.push({
        method: init.method || "GET",
        url,
        body: init.body ? JSON.parse(String(init.body)) : undefined,
      });
      assert.equal(init.headers instanceof Headers
        ? init.headers.get("authorization")
        : (init.headers as Record<string, string>)?.Authorization, "Bearer zoom-access-token");
      return jsonResponse({
        id: 987654321,
        join_url: "https://zoom.us/j/987654321",
        start_time: "2026-09-10T10:00:00Z",
        duration: 60,
      });
    },
    async baseUrl => {
      const response = await request(baseUrl, "POST", "/api/events", makeCreateBody());
      assert.equal(response.status, 201);
      assert.equal(response.body.zoomMeetingId, "987654321");
      assert.equal(response.body.meetingLink, "https://zoom.us/j/987654321");
    },
  );

  assert.equal(createdData?.zoomMeetingId, "987654321");
  assert.equal(createdData?.meetingLink, "https://zoom.us/j/987654321");
  assert.deepEqual(apiCalls.map(call => [call.method, call.url]), [
    ["POST", "https://api.zoom.us/v2/users/me/meetings"],
  ]);
  assert.equal(apiCalls[0].body?.topic, "Funding workshop");
});

test("editing a Zoom event updates the existing provider meeting without creating another", async () => {
  const existing = makeEvent();
  let updatedData: Record<string, unknown> | undefined;
  const apiCalls: Array<{ method: string; url: string; body?: Record<string, unknown> }> = [];

  await withEventRoutes(
    replace => {
      replace("getZoomOAuthConnection", async () => makeConnection());
      replace("getEvent", async () => existing);
      replace("updateEvent", async (_id: string, data: Record<string, unknown>) => {
        updatedData = data;
        return { ...existing, ...data };
      });
    },
    async (url, init) => {
      apiCalls.push({
        method: init.method || "GET",
        url,
        body: init.body ? JSON.parse(String(init.body)) : undefined,
      });
      if (init.method === "PATCH") return new Response(null, { status: 204 });
      return jsonResponse({
        id: "zoom-123",
        join_url: "https://zoom.us/j/zoom-123",
        start_time: "2026-09-12T12:00:00Z",
        duration: 90,
      });
    },
    async baseUrl => {
      const response = await request(baseUrl, "PATCH", "/api/events/event-1", {
        title: "Updated funding workshop",
        startTime: "2026-09-12T12:00:00.000Z",
        durationMinutes: 90,
      });
      assert.equal(response.status, 200);
      assert.equal(response.body.zoomMeetingId, "zoom-123");
      assert.equal(response.body.meetingLink, "https://zoom.us/j/zoom-123");
    },
  );

  assert.equal(updatedData?.zoomMeetingId, "zoom-123");
  assert.equal(updatedData?.meetingLink, "https://zoom.us/j/zoom-123");
  assert.deepEqual(apiCalls.map(call => [call.method, call.url]), [
    ["PATCH", "https://api.zoom.us/v2/meetings/zoom-123"],
    ["GET", "https://api.zoom.us/v2/meetings/zoom-123"],
  ]);
  assert.equal(apiCalls[0].body?.topic, "Updated funding workshop");
  assert.equal(apiCalls[0].body?.duration, 90);
});

test("a failed event creation deletes the newly provisioned Zoom meeting", async () => {
  const deletedMeetingIds: string[] = [];

  await withEventRoutes(
    replace => {
      replace("getZoomOAuthConnection", async () => makeConnection());
      replace("createEvent", async () => {
        throw new Error("event database unavailable");
      });
    },
    async (url, init) => {
      if (init.method === "POST") {
        return jsonResponse({ id: "orphaned-meeting", join_url: "https://zoom.us/j/orphaned-meeting" });
      }
      assert.equal(init.method, "DELETE");
      deletedMeetingIds.push(url.split("/").pop()!);
      return new Response(null, { status: 204 });
    },
    async baseUrl => {
      const response = await request(baseUrl, "POST", "/api/events", makeCreateBody());
      assert.equal(response.status, 502);
      assert.equal(response.body.error, "event database unavailable");
    },
  );

  assert.deepEqual(deletedMeetingIds, ["orphaned-meeting"]);
});

test("a failed event update deletes a newly provisioned Zoom meeting", async () => {
  const deletedMeetingIds: string[] = [];
  const eventWithoutMeeting = makeEvent({
    meetingLink: null,
    zoomMeetingId: null,
  });

  await withEventRoutes(
    replace => {
      replace("getZoomOAuthConnection", async () => makeConnection());
      replace("getEvent", async () => eventWithoutMeeting);
      replace("updateEvent", async () => undefined);
    },
    async (url, init) => {
      if (init.method === "POST") {
        return jsonResponse({ id: "orphaned-update-meeting", join_url: "https://zoom.us/j/orphaned-update-meeting" });
      }
      assert.equal(init.method, "DELETE");
      deletedMeetingIds.push(url.split("/").pop()!);
      return new Response(null, { status: 204 });
    },
    async baseUrl => {
      const response = await request(baseUrl, "PATCH", "/api/events/event-1", {
        title: "Updated funding workshop",
      });
      assert.equal(response.status, 502);
      assert.match(response.body.error, /could not be saved/i);
    },
  );

  assert.deepEqual(deletedMeetingIds, ["orphaned-update-meeting"]);
});

test("event creation explains when Zoom is not connected", async () => {
  let providerCalled = false;

  await withEventRoutes(
    replace => {
      replace("getZoomOAuthConnection", async () => undefined);
      replace("createEvent", async () => {
        throw new Error("should not save without Zoom authorization");
      });
    },
    async () => {
      providerCalled = true;
      return jsonResponse({});
    },
    async baseUrl => {
      const response = await request(baseUrl, "POST", "/api/events", makeCreateBody());
      assert.equal(response.status, 502);
      assert.match(response.body.error, /Zoom is not connected.*Connect the AFÁRÁ Zoom account/i);
    },
  );

  assert.equal(providerCalled, false);
});

test("event creation explains when the saved Zoom authorization has expired", async () => {
  let refreshed = false;

  await withEventRoutes(
    replace => {
      replace("getZoomOAuthConnection", async () => makeConnection(true));
      replace("createEvent", async () => {
        throw new Error("should not save with expired Zoom authorization");
      });
    },
    async (url, init) => {
      assert.equal(url, "https://zoom.us/oauth/token");
      assert.equal(init.method, "POST");
      refreshed = true;
      return jsonResponse({ error: "invalid_grant", message: "refresh token is invalid" }, 400);
    },
    async baseUrl => {
      const response = await request(baseUrl, "POST", "/api/events", makeCreateBody());
      assert.equal(response.status, 502);
      assert.match(response.body.error, /Zoom authorization has expired or is invalid.*Reconnect the AFÁRÁ Zoom account/i);
    },
  );

  assert.equal(refreshed, true);
});
