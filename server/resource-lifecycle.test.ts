import assert from "node:assert/strict";
import express from "express";
import test from "node:test";
import type { Server } from "node:http";

import { registerRoutes, type ResourceLifecycleDependencies } from "./routes";
import { storage } from "./storage";

const adminId = "resource-lifecycle-admin";
const oldStorageKey = "private/resources/private-videos/old-video.mp4";
const newStorageKey = "private/resources/private-videos/new-video.mp4";

type ResourceRecord = {
  id: string;
  title: string;
  description: string | null;
  resourceType: "video";
  category: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  thumbnailUrl: string | null;
  downloadCount: number;
  uploadedById: string | null;
  visibility: "community";
  status: "published";
  partnerName: string | null;
  partnerLoginUrl: string | null;
  partnerLoginUsername: string | null;
  partnerLoginPassword: string | null;
  youtubeVideoId: string | null;
  youtubeUrl: string | null;
  youtubeThumbnailUrl: string | null;
  youtubeDurationSeconds: number | null;
  youtubePrivacyStatus: string | null;
  youtubeUploadStatus: string | null;
  videoSource: "upload";
  videoStorageKey: string;
  videoContentType: string;
  videoFileSize: number;
  createdAt: Date;
};

function makeResource(videoStorageKey: string): ResourceRecord {
  return {
    id: "resource-1",
    title: "Protected workshop",
    description: null,
    resourceType: "video",
    category: null,
    fileUrl: null,
    fileName: "workshop.mp4",
    fileSize: 1,
    thumbnailUrl: null,
    downloadCount: 0,
    uploadedById: adminId,
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
    youtubePrivacyStatus: null,
    youtubeUploadStatus: null,
    videoSource: "upload",
    videoStorageKey,
    videoContentType: "video/mp4",
    videoFileSize: 1,
    createdAt: new Date("2026-08-27T00:00:00.000Z"),
  };
}

type StorageMethod = (...args: any[]) => any;

async function withResourceRoutes<T>(
  dependencies: ResourceLifecycleDependencies,
  configureStorage: (resource: ResourceRecord) => void,
  callback: (baseUrl: string) => Promise<T>,
): Promise<T> {
  const resource = makeResource(oldStorageKey);
  const mutableStorage = storage as unknown as Record<string, StorageMethod>;
  const originalMethods = new Map<string, StorageMethod | undefined>();
  const replace = (name: string, implementation: StorageMethod) => {
    if (!originalMethods.has(name)) originalMethods.set(name, mutableStorage[name]);
    mutableStorage[name] = implementation;
  };

  replace("getUser", async () => ({
    id: adminId,
    isActive: true,
    mustChangePassword: false,
  }));
  replace("getExpiredPrivateVideoUploads", async () => []);
  replace("getPrivateVideoUploads", async () => []);
  replace("getResourceByVideoStorageKey", async () => undefined);
  replace("removePrivateVideoUpload", async () => undefined);
  replace("claimPrivateVideoUpload", async () => undefined);
  replace("releasePrivateVideoUpload", async () => undefined);
  configureStorage(resource);

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
    server = await registerRoutes(app, dependencies);
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
  method: "PATCH" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: response.status,
    body: await response.text(),
  };
}

test("deleting a resource removes its private video object", async () => {
  const events: string[] = [];
  let resource: ResourceRecord;
  const result = await withResourceRoutes(
    {
      deletePrivateVideo: async key => {
        events.push(`delete:${key}`);
      },
    },
    initialResource => {
      resource = initialResource;
      const mutableStorage = storage as unknown as Record<string, StorageMethod>;
      mutableStorage.getResource = async () => resource;
      mutableStorage.deleteResource = async () => {
        events.push("resource-delete");
        resource = undefined as never;
      };
    },
    baseUrl => request(baseUrl, "DELETE", "/api/resources/resource-1"),
  );

  assert.equal(result.status, 204);
  assert.deepEqual(events, [
    "resource-delete",
    `delete:${oldStorageKey}`,
  ]);
});

test("replacement saves the new resource before deleting the old private video", async () => {
  const events: string[] = [];
  let resource: ResourceRecord;
  const result = await withResourceRoutes(
    {
      deletePrivateVideo: async key => {
        events.push(`delete:${key}`);
      },
    },
    initialResource => {
      resource = initialResource;
      const mutableStorage = storage as unknown as Record<string, StorageMethod>;
      mutableStorage.getResource = async () => resource;
      mutableStorage.updateResource = async (_id: string, data: Record<string, unknown>) => {
        events.push("resource-update");
        resource = { ...resource, ...data } as ResourceRecord;
        return resource;
      };
    },
    baseUrl => request(
      baseUrl,
      "PATCH",
      "/api/resources/resource-1",
      { videoStorageKey: newStorageKey },
    ),
  );

  assert.equal(result.status, 200);
  assert.deepEqual(events, [
    "resource-update",
    `delete:${oldStorageKey}`,
  ]);
  assert.match(result.body, new RegExp(newStorageKey.replaceAll("/", "\\/")));
});

test("cleanup failures are logged without changing the generic API response", async () => {
  const logCalls: unknown[][] = [];
  const storageFailure = "provider-internal-secret";
  let resource: ResourceRecord;
  const result = await withResourceRoutes(
    {
      deletePrivateVideo: async () => {
        throw new Error(storageFailure);
      },
      logError: (...args) => {
        logCalls.push(args);
      },
    },
    initialResource => {
      resource = initialResource;
      const mutableStorage = storage as unknown as Record<string, StorageMethod>;
      mutableStorage.getResource = async () => resource;
      mutableStorage.deleteResource = async () => {
        resource = undefined as never;
      };
    },
    baseUrl => request(baseUrl, "DELETE", "/api/resources/resource-1"),
  );

  assert.equal(result.status, 204);
  assert.equal(result.body, "");
  assert.equal(logCalls.length, 1);
  assert.match(String(logCalls[0][0]), /Failed to clean up private video/);
  assert.equal(String(logCalls[0][0]).includes(storageFailure), false);
  assert.equal(result.body.includes(storageFailure), false);
});

test("a transient cleanup failure remains retryable through the admin reconciliation route", async () => {
  const events: string[] = [];
  let resource: ResourceRecord;
  let cleanupEnabled = false;
  let shouldFailDelete = true;
  let upload = {
    id: "private-video-upload-1",
    storageKey: oldStorageKey,
    uploadedById: adminId,
    resourceId: "resource-1",
    cleanupRequestedAt: null as Date | null,
    createdAt: new Date("2026-08-25T00:00:00.000Z"),
  };
  const result = await withResourceRoutes(
    {
      listPrivateVideoFiles: async () => cleanupEnabled ? [oldStorageKey] : [],
      deletePrivateVideo: async key => {
        events.push(`delete:${key}`);
        if (shouldFailDelete) throw new Error("temporary storage outage");
      },
      logError: (...args) => {
        events.push(`log:${String(args[0])}`);
      },
    },
    initialResource => {
      resource = initialResource;
      const mutableStorage = storage as unknown as Record<string, StorageMethod>;
      mutableStorage.getResource = async (id: string) =>
        id === resource.id ? resource : undefined;
      mutableStorage.updateResource = async (_id: string, data: Record<string, unknown>) => {
        events.push("resource-update");
        resource = { ...resource, ...data } as ResourceRecord;
        return resource;
      };
      mutableStorage.getPrivateVideoUploads = async () => upload ? [upload] : [];
      mutableStorage.releasePrivateVideoUpload = async (key: string, resourceId: string) => {
        events.push(`release:${resourceId}`);
        if (upload.storageKey === key && upload.resourceId === resourceId) {
          upload = { ...upload, resourceId: null, cleanupRequestedAt: new Date() };
        }
      };
      mutableStorage.removePrivateVideoUpload = async key => {
        events.push(`remove:${key}`);
        if (upload.storageKey === key) upload = undefined as never;
      };
    },
    async baseUrl => {
      const update = await request(
        baseUrl,
        "PATCH",
        "/api/resources/resource-1",
        { videoStorageKey: newStorageKey },
      );
      assert.equal(update.status, 200);
      assert.equal(upload.resourceId, null);

      cleanupEnabled = true;
      const failedRetry = await request(
        baseUrl,
        "POST",
        "/api/admin/resources/private-videos/reconcile",
      );
      assert.equal(failedRetry.status, 200);
      assert.deepEqual(JSON.parse(failedRetry.body), {
        scanned: 1,
        deletedKeys: [],
        failedKeys: [oldStorageKey],
        untrackedKeys: [],
      });
      assert.ok(upload);

      shouldFailDelete = false;
      const successfulRetry = await request(
        baseUrl,
        "POST",
        "/api/admin/resources/private-videos/reconcile",
      );
      assert.equal(successfulRetry.status, 200);
      assert.deepEqual(JSON.parse(successfulRetry.body), {
        scanned: 1,
        deletedKeys: [oldStorageKey],
        failedKeys: [],
        untrackedKeys: [],
      });
      assert.equal(upload, undefined);
      return { update, failedRetry, successfulRetry };
    },
  );

  assert.equal(result.update.status, 200);
  assert.deepEqual(events, [
    "resource-update",
    "release:resource-1",
    `delete:${oldStorageKey}`,
    "log:Failed to clean up private video for resource resource-1.",
    `delete:${oldStorageKey}`,
    "log:Failed to reconcile private video upload private-video-upload-1.",
    `delete:${oldStorageKey}`,
    `remove:${oldStorageKey}`,
  ]);
});

test("reconciliation reports only unattached private-video namespace keys", async () => {
  const privateKey = "private/resources/private-videos/untracked-video.mp4";
  const result = await withResourceRoutes(
    {
      listPrivateVideoFiles: async () => [
        privateKey,
        "private/resources/documents/not-a-video.pdf",
        "public/resources/other.pdf",
      ],
      deletePrivateVideo: async () => {
        throw new Error("should not delete untracked objects");
      },
    },
    initialResource => {
      const mutableStorage = storage as unknown as Record<string, StorageMethod>;
      mutableStorage.getResource = async () => undefined;
      mutableStorage.getPrivateVideoUploads = async () => [];
      mutableStorage.removePrivateVideoUpload = async () => undefined;
      void initialResource;
    },
    async baseUrl => {
      const response = await request(
        baseUrl,
        "POST",
        "/api/admin/resources/private-videos/reconcile",
      );
      assert.equal(response.status, 200);
      assert.deepEqual(JSON.parse(response.body), {
        scanned: 1,
        deletedKeys: [],
        failedKeys: [],
        untrackedKeys: [
          privateKey,
        ],
      });
      return response;
    },
  );

  assert.equal(result.status, 200);
});