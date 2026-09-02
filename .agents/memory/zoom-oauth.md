---
name: Zoom OAuth connection
description: Authorization and account metadata behavior for AFÁRÁ-managed Zoom meeting automation
---

Zoom meeting automation is authorized through the AFÁRÁ application’s own OAuth callback, with tokens encrypted at rest. Zoom user-profile metadata is optional and must not be required for a successful meeting-management connection.

**Why:** Zoom scopes that allow creating and updating meetings do not necessarily include permission to read the current user profile.

**How to apply:** Save valid OAuth tokens even when the optional profile lookup is unavailable; treat missing profile email/ID as an expected state in admin status UI.

Zoom authorization must open in a top-level browser tab rather than replacing the Replit preview iframe.

**Why:** Zoom blocks its authorization page from being embedded, so iframe navigation appears blank or never loads even though the OAuth URL is valid.

**How to apply:** Launch the AFÁRÁ Zoom connect endpoint in a new tab or window; keep the callback on the same environment so its session state and database connection remain valid.