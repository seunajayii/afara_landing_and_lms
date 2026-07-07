---
name: Cohort system
description: Architecture of the cohort management and per-cohort analytics filtering added to the application review feature.
---

## Rule
All cohort routes (`/api/admin/cohorts*`, `/api/admin/applications/:id/cohort`, `/api/admin/cohort-analytics/evaluate-all`) require `requireAuth + requireAdminRole`.

**Why:** Cohort data is internal admin-only metadata; public/participant routes must never expose it.

**How to apply:** Any new cohort-related route must use both middleware guards. The `GET /api/admin/cohort-analytics` route also accepts `?cohortId=` query param and filters `applications` server-side but returns ALL evaluations (frontend filters to matching app IDs).

## Auto-eval
`triggerAutoEvaluate(applicationId)` is a function declaration inside `registerRoutes` in `server/routes.ts` (hoisted). Called after the submission confirmation email on both POST `/api/applications` and PATCH `/api/applications/:id/save`. Fire-and-forget, never awaited, logs `[auto-eval]` prefix.

## Batch eval
`POST /api/admin/cohort-analytics/evaluate-all` uses `p-limit(3)` concurrency. Only evaluates apps with non-draft statuses. Accepts optional `{ cohortId }` body to scope to a cohort.
