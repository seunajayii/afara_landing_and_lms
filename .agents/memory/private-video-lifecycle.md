---
name: Private video lifecycle
description: The consistency rule for private hosted video object cleanup
---

Save resource record changes before attempting to delete replaced or removed private video objects. Cleanup is best-effort and must not turn a successful database mutation into a learner-visible storage error.

**Why:** The database record is the authoritative association. Deleting storage first can break playback if the database mutation fails, while a storage outage after a successful mutation only leaves an orphan for later cleanup.

**How to apply:** Restrict lifecycle cleanup to the generated private-video key namespace, log failures without returning provider details, and clean up the old key only after a replacement is saved.