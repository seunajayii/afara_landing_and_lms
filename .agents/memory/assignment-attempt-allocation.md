---
name: Assignment attempt allocation
description: Concurrency invariant for learner assignment submission history
---

Learner assignment attempt numbers must be allocated at persistence time under a transaction-scoped lock, with a database uniqueness safeguard on assignment, learner, and attempt.

**Why:** Reading the latest attempt before inserting leaves a race when two first submissions arrive together; there may be no existing row available for a normal row lock to serialize.

**How to apply:** Keep attempt allocation in the storage transaction rather than the request route. Use a transaction-scoped advisory lock for the assignment/learner key and retain the unique constraint as defense in depth.