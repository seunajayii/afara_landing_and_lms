import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGoogleCalendarUrl,
  buildIcsInvite,
  buildOutlookCalendarUrl,
  getCalendarEventDetails,
} from "../client/src/lib/calendar.ts";

const event = {
  id: "event-123",
  title: "Funding, Growth & Scale",
  description: "Bring your questions;\nwe will discuss the next steps.",
  startTime: "2026-09-10T10:00:00.000Z",
  durationMinutes: 90,
  meetingLink: "https://zoom.us/j/123?pwd=one&two=two",
  meetingPlatform: "Zoom",
};

test("calendar details use duration when an event has no end time", () => {
  const details = getCalendarEventDetails(event, "https://afara.example/lms/events/event-123");

  assert.equal(details.start.toISOString(), "2026-09-10T10:00:00.000Z");
  assert.equal(details.end.toISOString(), "2026-09-10T11:30:00.000Z");
  assert.match(details.description, /Bring your questions;/);
  assert.match(details.description, /Join link: https:\/\/zoom\.us/);
  assert.match(details.location, /^https:\/\/zoom\.us/);
});

test("Google Calendar links encode the event details and use UTC instants", () => {
  const url = new URL(buildGoogleCalendarUrl(event, "https://afara.example/lms/events/event-123"));

  assert.equal(url.origin, "https://calendar.google.com");
  assert.equal(url.searchParams.get("action"), "TEMPLATE");
  assert.equal(url.searchParams.get("text"), event.title);
  assert.equal(url.searchParams.get("dates"), "20260910T100000Z/20260910T113000Z");
  assert.match(url.searchParams.get("details") || "", /Event page: https:\/\/afara\.example/);
  assert.match(url.searchParams.get("location") || "", /zoom\.us/);
  assert.match(url.toString(), /%26/);
});

test("Microsoft Outlook Calendar links include the same instant and event context", () => {
  const url = new URL(buildOutlookCalendarUrl(event, "https://afara.example/lms/events/event-123"));

  assert.equal(url.origin, "https://outlook.live.com");
  assert.equal(url.pathname, "/calendar/0/deeplink/compose");
  assert.equal(url.searchParams.get("rru"), "addevent");
  assert.equal(url.searchParams.get("subject"), event.title);
  assert.equal(url.searchParams.get("startdt"), "2026-09-10T10:00:00Z");
  assert.equal(url.searchParams.get("enddt"), "2026-09-10T11:30:00Z");
  assert.match(url.searchParams.get("body") || "", /Event page: https:\/\/afara\.example/);
});

test("ICS invites preserve escaped text and the duration fallback", () => {
  const ics = buildIcsInvite(event, "https://afara.example/lms/events/event-123");

  assert.match(ics, /SUMMARY:Funding\\, Growth & Scale/);
  assert.match(ics, /DESCRIPTION:Bring your questions\\;\\nwe will discuss/);
  assert.match(ics, /DTSTART:20260910T100000Z/);
  assert.match(ics, /DTEND:20260910T113000Z/);
  assert.match(ics, /URL:https:\/\/afara\.example\/lms\/events\/event-123/);
});