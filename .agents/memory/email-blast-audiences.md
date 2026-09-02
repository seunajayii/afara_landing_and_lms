---
name: Email blast audiences
description: Durable audience and compatibility rules for admin email campaigns
---

Campaign audiences should remain dynamic criteria stored with each draft, not copied recipient lists. Resolve the selected groups against current users, newsletter subscribers, cohorts, and applications at send time, then deduplicate by normalized email address. Keep a fallback for older campaigns that only contain raw HTML and have no structured audience.

**Why:** Cohort membership, applicant status, and active-account state can change between drafting and sending; resolving at send time prevents stale or duplicate deliveries while preserving existing campaign history.

**How to apply:** When extending campaigns, add new audience criteria to the structured audience model and keep old HTML-only rows readable and sendable.