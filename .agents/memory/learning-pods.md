---
name: Learning pod operating rules
description: Product rules for cohort-based learning pods, assignments, submissions, and mentor review
---

Learning Pods are the primary mentorship experience. Each active pod belongs to one cohort, has exactly one active mentor, and contains accepted participants from that cohort. A participant may belong to only one active pod in a cohort.

**Why:** Pods are intended to create a stable peer group around a cohort while preserving the existing one-to-one mentor directory and session tools. Membership must not be inferred from client state or a stale application record.

**How to apply:** Keep cohort acceptance and pod membership checks on the server. Individual assignments have one submission per participant; group projects have one shared submission per pod. Reviews require a numeric score and written mentor feedback, and only the assigned mentor or an administrator may review.

Pod submission request validation must treat assignment, pod, and submitter identity as server-owned values derived from the route and session, not client-provided fields.

**Why:** Requiring those fields in the body rejects valid submissions, while accepting client-selected values would permit ownership and cross-pod confusion.

**How to apply:** Omit server-derived identifiers from learner submission payload schemas and set them from the matched assignment, pod, and authenticated participant.