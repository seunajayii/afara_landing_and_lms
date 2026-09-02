---
name: Zoom webhook setup
description: Durable setup rules for Zoom OAuth event subscriptions and webhook validation
---

Zoom OAuth redirect URLs and Zoom Event Subscription webhook URLs are separate concerns. The OAuth callback is not a valid event notification endpoint. Zoom's account-level “All recordings completed” subscription maps to the recording-completed event and should be received through the application's signed webhook route.

**Why:** Zoom validates the event endpoint independently using a Secret Token and signed raw request body; accepting the OAuth callback URL or an unsigned request would either fail validation or weaken the integration.

**How to apply:** For local testing, use the public Replit development domain plus the webhook path and store Zoom's Event Subscription Secret Token as a Replit Secret. Replace the development URL with the published application URL before production use.