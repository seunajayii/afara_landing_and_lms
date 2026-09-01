---
name: Object Storage provisioning
description: Replit App Storage SDK behavior when the project has storage environment variables but no usable default bucket.
---

Replit's JavaScript App Storage SDK should be initialized with `new Client()` so it discovers the app's default bucket. Environment variables can exist while the sidecar still has no provisioned default bucket; treat availability as a separate runtime check and fail protected uploads explicitly rather than falling back to ephemeral disk or database blobs.

**Why:** A project can appear storage-configured while SDK reads and writes fail because the default bucket has not been provisioned.

**How to apply:** Probe storage before background reconciliation, keep private playback behind the application authorization route, and ask for bucket provisioning when protected uploads are unavailable.

In this workspace, the provisioning control can report an existing bucket and return a bucket ID while the local sidecar still responds with an empty default bucket. In that state, both the default SDK client and an explicitly bound client fail storage operations; treat the control result and the runtime probe as separate signals.

**Why:** Environment-level storage setup and the running sidecar can become temporarily inconsistent, so configuration success alone is not proof that protected uploads work.

**How to apply:** Restart the application after provisioning, then run a real list/write/read/delete probe before claiming protected video uploads are operational.