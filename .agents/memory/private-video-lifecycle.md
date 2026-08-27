---
name: Private video lifecycle
description: The consistency rule for private hosted video object cleanup
---

Save resource record changes before attempting to delete replaced or removed private video objects. Cleanup is best-effort and must not turn a successful database mutation into a learner-visible storage error.

**Why:** The database record is the authoritative association. Deleting storage first can break playback if the database mutation fails, while a storage outage after a successful mutation only leaves an orphan for later cleanup.

**How to apply:** Record an explicit cleanup request in the upload ledger before deletion, restrict reconciliation to generated private-video namespace keys that are no longer attached to a resource, log failures without returning provider details, and clean up the old key only after a replacement is saved. Retain ledger rows with a removed status and attempt metadata so cleanup health survives restarts and can be reported to admins.