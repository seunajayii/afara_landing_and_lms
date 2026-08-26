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

## Concurrent open cohorts is an intentional product decision
Multiple cohorts (e.g. AFARA CORE and DOREWA) can be open for applications at the same time — AFARA runs several recurring, independently-scheduled cohorts under one platform, not a single global intake.

**Why:** Reflects the real product model; the old "opening one cohort auto-closes all others" behavior didn't fit it.

**How to apply:** Because of this, any endpoint that auto-assigns an application to "the" open cohort is ambiguous once more than one cohort is open — check current code for how each such endpoint resolves that ambiguity (e.g. requiring an explicit cohort/slug, or refusing to guess) rather than assuming a single global open cohort still exists.

## Public cohort resolution conventions
Public (unauthenticated) cohort access uses three purpose-built endpoints rather than exposing admin cohort rows directly: a public list (drafts hidden), a "primary" cohort resolver, and a by-slug resolver. All map through a `toPublicCohort`-style trimmed projection.

**Why:** Bare `/apply` and cohort-slug apply routes (`/apply/:slug`) need a deterministic, tamper-proof way to know which cohort an applicant means, without ever trusting a client-supplied cohort id and without leaking internal-only fields.

**How to apply:** The "primary" cohort (what bare `/apply` maps to) is resolved server-side as `cohortType === 'core'`, preferring `status === 'open'` else most recently created — never hardcode a slug like `"core"` for this. The by-slug lookup intentionally ignores status (returns drafts/closed/archived too) so `/apply/:slug` and admin-adjacent flows can render their own closed/not-open experience instead of 404ing; only the public marketing listing filters out drafts. Client submissions send a `cohortSlug` string (not `cohortId`); the server resolves it and falls back to the older "exactly one cohort open" auto-assign heuristic if the slug is missing or unresolvable, rather than hard-failing the submission.
