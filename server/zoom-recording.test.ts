import assert from "node:assert/strict";
import test from "node:test";

import { processZoomRecordingWebhook } from "./routes";
import { storage } from "./storage";

type StorageMethod = (...args: any[]) => any;

test("imports a completed Zoom MP4 into protected event and lesson resources", async () => {
  const mutableStorage = storage as unknown as Record<string, StorageMethod>;
  const originalMethods = new Map<string, StorageMethod | undefined>();
  const replace = (name: string, implementation: StorageMethod) => {
    if (!originalMethods.has(name)) originalMethods.set(name, mutableStorage[name]);
    mutableStorage[name] = implementation;
  };

  const event = {
    id: "event-1",
    title: "AFÁRÁ funding workshop",
    visibility: "cohort_only",
    zoomMeetingId: "87565330005",
    meetingLink: null,
    recordingResourceId: null,
    recordingLessonId: "lesson-1",
  };
  const claimedWebhook = {
    eventId: "webhook-1",
    eventType: "recording.completed",
    payload: {
      payload: {
        object: {
          id: 87565330005,
          topic: "AFÁRÁ funding workshop",
          download_token: "download-token",
          recording_files: [{
            id: "recording-file-1",
            meeting_id: "87565330005",
            file_type: "MP4",
            file_extension: "MP4",
            file_size: 42,
            download_url: "https://us02web.zoom.us/rec/webhook_download/example",
            status: "completed",
          }],
        },
      },
    },
  };
  let createdResource: any;
  let updatedLesson: any;
  let updatedEvent: any;
  let completed = false;

  replace("claimZoomWebhookEvent", async () => claimedWebhook);
  replace("getAllEvents", async () => [event]);
  replace("getResourceByVideoStorageKey", async () => undefined);
  replace("getResource", async () => undefined);
  replace("trackPrivateVideoUpload", async () => undefined);
  replace("createResource", async (resource: any) => {
    createdResource = { id: "resource-1", ...resource };
    return createdResource;
  });
  replace("claimPrivateVideoUpload", async () => undefined);
  replace("getLesson", async () => ({
    id: "lesson-1",
    lessonType: "video",
    resourceId: null,
  }));
  replace("updateLesson", async (_id: string, data: any) => {
    updatedLesson = data;
    return { id: "lesson-1", ...data };
  });
  replace("updateEvent", async (_id: string, data: any) => {
    updatedEvent = data;
    return { ...event, ...data };
  });
  replace("markZoomWebhookEventCompleted", async () => {
    completed = true;
  });
  replace("markZoomWebhookEventFailed", async () => {
    throw new Error("failure status should not be written");
  });

  try {
    await processZoomRecordingWebhook("webhook-1", {
      downloadZoomRecording: async (input) => {
        assert.equal(input.downloadUrl, "https://us02web.zoom.us/rec/webhook_download/example");
        assert.equal(input.downloadToken, "download-token");
        return {
          body: Buffer.from("video bytes"),
          contentType: "video/mp4",
          fileSize: 11,
        };
      },
      uploadPrivateVideo: async (key, body, contentType) => {
        assert.match(key, /^resources\/private-videos\/zoom-[a-f0-9]{64}\.mp4$/);
        assert.equal(body.toString(), "video bytes");
        assert.equal(contentType, "video/mp4");
        return { key: `private/${key}` };
      },
    });

    assert.equal(createdResource.resourceType, "video");
    assert.equal(createdResource.visibility, "cohort_only");
    assert.equal(createdResource.videoSource, "upload");
    assert.equal(updatedLesson.resourceId, "resource-1");
    assert.equal(updatedEvent.recordingResourceId, "resource-1");
    assert.equal(completed, true);
  } finally {
    for (const [name, implementation] of originalMethods) {
      if (implementation) mutableStorage[name] = implementation;
      else delete mutableStorage[name];
    }
  }
});

test("does not download a recording when another worker owns the webhook claim", async () => {
  const mutableStorage = storage as unknown as Record<string, StorageMethod>;
  const originalClaim = mutableStorage.claimZoomWebhookEvent;
  mutableStorage.claimZoomWebhookEvent = async () => undefined;
  let downloaded = false;

  try {
    await processZoomRecordingWebhook("webhook-in-progress", {
      downloadZoomRecording: async () => {
        downloaded = true;
        throw new Error("should not download");
      },
    });
    assert.equal(downloaded, false);
  } finally {
    mutableStorage.claimZoomWebhookEvent = originalClaim;
  }
});

test("records a useful failure when no event matches the completed recording", async () => {
  const mutableStorage = storage as unknown as Record<string, StorageMethod>;
  const originalMethods = new Map<string, StorageMethod | undefined>();
  const replace = (name: string, implementation: StorageMethod) => {
    if (!originalMethods.has(name)) originalMethods.set(name, mutableStorage[name]);
    mutableStorage[name] = implementation;
  };
  let failure = "";

  replace("claimZoomWebhookEvent", async () => ({
    eventId: "webhook-no-match",
    eventType: "recording.completed",
    payload: {
      payload: {
        object: {
          id: 87565330005,
          recording_files: [{
            file_type: "MP4",
            download_url: "https://us02web.zoom.us/rec/webhook_download/no-match",
            status: "completed",
          }],
        },
      },
    },
  }));
  replace("getAllEvents", async () => []);
  replace("markZoomWebhookEventFailed", async (_id: string, message: string) => {
    failure = message;
  });

  try {
    await processZoomRecordingWebhook("webhook-no-match", { logError: () => undefined });
    assert.equal(failure, "No AFÁRÁ event matches this Zoom meeting.");
  } finally {
    for (const [name, implementation] of originalMethods) {
      if (implementation) mutableStorage[name] = implementation;
      else delete mutableStorage[name];
    }
  }
});