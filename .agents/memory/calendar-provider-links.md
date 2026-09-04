---
name: Calendar provider links
description: Product and date-handling rules for adding authorized events to external calendars.
---

Google Calendar and Microsoft Outlook Calendar compose links are the primary “Add to Calendar” actions for programme events and course live classes. A downloaded `.ics` invite remains available for other calendar applications.

**Why:** Participants expect the action to open their actual calendar with event details prefilled, rather than silently downloading a file they may not know how to use.

**How to apply:** Build provider links only from event data the viewer is already authorized to see. Encode start and end as UTC instants so providers display the correct local time, derive a missing end from duration, and include the meeting link plus the relevant AFÁRÁ page in the description.