export type CalendarEventData = {
  id: string;
  title: string;
  description?: string | null;
  startTime: string | Date;
  endTime?: string | Date | null;
  durationMinutes?: number | null;
  meetingLink?: string | null;
  meetingPlatform?: string | null;
};

export type CalendarEventDetails = {
  start: Date;
  end: Date;
  eventPageUrl: string;
  location: string;
  description: string;
};

export function getCalendarEventDetails(event: CalendarEventData, eventPageUrl: string): CalendarEventDetails {
  const start = new Date(event.startTime);
  const end = event.endTime
    ? new Date(event.endTime)
    : new Date(start.getTime() + (event.durationMinutes || 60) * 60 * 1000);
  const location = event.meetingLink || (event.meetingPlatform
    ? `Virtual (${event.meetingPlatform})`
    : "AFÁRÁ event");
  const description = [
    event.description,
    event.meetingLink ? `Join link: ${event.meetingLink}` : "Join link will be shared by the organizer.",
    `Event page: ${eventPageUrl}`,
  ].filter(Boolean).join("\n\n");

  return { start, end, eventPageUrl, location, description };
}

function formatProviderDate(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function formatGoogleDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildGoogleCalendarUrl(event: CalendarEventData, eventPageUrl: string): string {
  const details = getCalendarEventDetails(event, eventPageUrl);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatGoogleDate(details.start)}/${formatGoogleDate(details.end)}`,
    details: details.description,
    location: details.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildOutlookCalendarUrl(event: CalendarEventData, eventPageUrl: string): string {
  const details = getCalendarEventDetails(event, eventPageUrl);
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: formatProviderDate(details.start),
    enddt: formatProviderDate(details.end),
    body: details.description,
    location: details.location,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildIcsInvite(event: CalendarEventData, eventPageUrl: string): string {
  const details = getCalendarEventDetails(event, eventPageUrl);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AFARA//LMS Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id}@afara`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(details.start)}`,
    `DTEND:${formatIcsDate(details.end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(details.description)}`,
    `LOCATION:${escapeIcsText(details.location)}`,
    `URL:${eventPageUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcsInvite(event: CalendarEventData, eventPageUrl: string): void {
  const blob = new Blob([buildIcsInvite(event, eventPageUrl)], { type: "text/calendar;charset=utf-8" });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `${event.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "afara-event"}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
}