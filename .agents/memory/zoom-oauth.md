---
name: Zoom OAuth connection
description: Authorization and account metadata behavior for AFÁRÁ-managed Zoom meeting automation
---

Zoom meeting automation is authorized through the AFÁRÁ application’s own OAuth callback, with tokens encrypted at rest. Zoom user-profile metadata is optional and must not be required for a successful meeting-management connection.

**Why:** Zoom scopes that allow creating and updating meetings do not necessarily include permission to read the current user profile.

**How to apply:** Save valid OAuth tokens even when the optional profile lookup is unavailable; treat missing profile email/ID as an expected state in admin status UI.