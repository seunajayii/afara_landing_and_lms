---
name: Object Storage provisioning
description: Replit App Storage SDK behavior when the project has storage environment variables but no usable default bucket.
---

Replit's JavaScript App Storage SDK should be initialized with `new Client()` so it discovers the app's default bucket. Environment variables can exist while the sidecar still has no provisioned default bucket; treat availability as a separate runtime check and fail protected uploads explicitly rather than falling back to ephemeral disk or database blobs.

**Why:** A project can appear storage-configured while SDK reads and writes fail because the default bucket has not been provisioned.

**How to apply:** Probe storage before background reconciliation, keep private playback behind the application authorization route, and ask for bucket provisioning when protected uploads are unavailable.