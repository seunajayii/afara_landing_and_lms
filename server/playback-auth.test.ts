import assert from "node:assert/strict";
import test from "node:test";
import {
  authorizePlayback,
  createPlaybackToken,
  isPlaybackTokenAuthorized,
  readPlaybackToken,
  type PlaybackResource,
  type PlaybackUser,
} from "./playback-auth";

const secret = "playback-test-secret";
const protectedVideo: PlaybackResource = {
  resourceType: "video",
  visibility: "community",
  status: "published",
};
const cohortVideo: PlaybackResource = {
  ...protectedVideo,
  visibility: "cohort_only",
};
const publicVideo: PlaybackResource = {
  ...protectedVideo,
  visibility: "public",
};
const participant: PlaybackUser = {
  id: "user-a",
  role: "participant",
  isActive: true,
};

test("protected playback requires an active session and binds the token to that user", () => {
  const token = readPlaybackToken(
    createPlaybackToken("video-1", participant.id, secret, 1_000),
    secret,
    1_001,
  );
  assert.ok(token);

  assert.equal(authorizePlayback(protectedVideo, null, undefined).status, 403);
  assert.equal(isPlaybackTokenAuthorized(protectedVideo, token, null), false);
  assert.equal(authorizePlayback(protectedVideo, participant.id, participant).status, 200);
  assert.equal(isPlaybackTokenAuthorized(protectedVideo, token, participant.id), true);

  const otherUser = { ...participant, id: "user-b" };
  assert.equal(authorizePlayback(protectedVideo, otherUser.id, otherUser).status, 200);
  assert.equal(isPlaybackTokenAuthorized(protectedVideo, token, otherUser.id), false);
});

test("logout and deactivation revoke a previously issued token on the next request", () => {
  const token = readPlaybackToken(
    createPlaybackToken("video-1", participant.id, secret, 1_000),
    secret,
    1_001,
  );
  assert.ok(token);
  assert.equal(authorizePlayback(protectedVideo, participant.id, participant).status, 200);

  // This models the next range request after the session has been logged out.
  assert.equal(authorizePlayback(protectedVideo, null, undefined).status, 403);
  assert.equal(isPlaybackTokenAuthorized(protectedVideo, token, null), false);

  const deactivated = { ...participant, isActive: false };
  assert.equal(authorizePlayback(protectedVideo, participant.id, deactivated).status, 401);
  assert.equal(isPlaybackTokenAuthorized(protectedVideo, token, participant.id), true);
});

test("current role and visibility are rechecked for every playback request", () => {
  const token = readPlaybackToken(
    createPlaybackToken("video-2", participant.id, secret, 1_000),
    secret,
    1_001,
  );
  assert.ok(token);
  assert.equal(authorizePlayback(cohortVideo, participant.id, participant).status, 200);

  // A role change to community_member revokes cohort-only playback even
  // though the session ID and previously issued token are unchanged.
  const communityMember = { ...participant, role: "community_member" };
  assert.equal(authorizePlayback(cohortVideo, participant.id, communityMember).status, 403);
  assert.equal(isPlaybackTokenAuthorized(cohortVideo, token, participant.id), true);
});

test("public playback remains available without a session", () => {
  const token = readPlaybackToken(
    createPlaybackToken("video-3", null, secret, 1_000),
    secret,
    1_001,
  );
  assert.ok(token);

  assert.equal(authorizePlayback(publicVideo, null, undefined).status, 200);
  assert.equal(isPlaybackTokenAuthorized(publicVideo, token, null), true);
});

test("invalid and expired playback tokens are rejected", () => {
  const token = createPlaybackToken("video-1", participant.id, secret, 1_000, 10);
  assert.equal(readPlaybackToken(token, secret, 1_010), null);
  assert.equal(readPlaybackToken(`${token}tampered`, secret, 1_001), null);
  assert.equal(readPlaybackToken(token, "wrong-secret", 1_001), null);
});