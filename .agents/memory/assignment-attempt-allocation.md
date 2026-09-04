---
name: Assignment attempt allocation
description: Concurrency invariant for learner assignment submission history
---

Learner assignment attempt numbers must be allocated at persistence time under a transaction-scoped lock, with a database uniqueness safeguard on assignment, learner, and attempt.

**Why:** Reading the latest attempt before inserting leaves a race when two first submissions arrive together; there may be no existing row available for a normal row lock to serialize.

**How to apply:** Keep attempt allocation in the storage transaction rather than the request route. Use a transaction-scoped advisory lock for the assignment/learner key and retain the unique constraint as defense in depth.

For legacy duplicate histories, preserve every submission and grading field. Keep one deterministic survivor at each original attempt number, preferring graded/returned rows, and move only extra rows above the existing maximum. Record only identifiers and attempt metadata in the reconciliation audit.

**Why:** Applying the uniqueness safeguard must not delete or overwrite grading history, and operators need to explain repaired attempt numbers without exposing learner submission content.

**How to apply:** Run reconciliation before creating the unique index; use stable status, timestamp, and id ordering, and keep the audit mapping idempotent.