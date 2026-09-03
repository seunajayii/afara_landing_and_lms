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

## Admin cohort workspace context
The admin “Working in” cohort selection is the default operational context across applications, courses, assignments, pods, progress, analytics, reports, and newsletter audiences. Reusable resources remain global.

**Why:** Admins need to stay inside AFÁRÁ, Dorewa, or future cohort workspaces without accidentally reviewing or authoring against another cohort, while shared content assets must remain reusable.

**How to apply:** Preserve the selected cohort in admin navigation and default every cohort-aware screen to it. Shared courses may appear in every cohort; cohort-assigned courses appear only in their assigned workspace. Do not claim events or notifications are cohort-isolated until their data models store cohort targeting.

## Public cohort resolution conventions
Public (unauthenticated) cohort access uses three purpose-built endpoints rather than exposing admin cohort rows directly: a public list (drafts hidden), a "primary" cohort resolver, and a by-slug resolver. All map through a `toPublicCohort`-style trimmed projection.

**Why:** Bare `/apply` and cohort-slug apply routes (`/apply/:slug`) need a deterministic, tamper-proof way to know which cohort an applicant means, without ever trusting a client-supplied cohort id and without leaking internal-only fields.

**How to apply:** The "primary" cohort (what bare `/apply` maps to) is resolved server-side as `cohortType === 'core'`, preferring `status === 'open'` else most recently created — never hardcode a slug like `"core"` for this. The by-slug lookup intentionally ignores status (returns drafts/closed/archived too) so `/apply/:slug` and admin-adjacent flows can render their own closed/not-open experience instead of 404ing; only the public marketing listing filters out drafts. Client submissions send a `cohortSlug` string (not `cohortId`); the server resolves it and falls back to the older "exactly one cohort open" auto-assign heuristic if the slug is missing or unresolvable, rather than hard-failing the submission.

## Cohort-branded transactional email
`server/email.ts` derives per-cohort email branding (accent color, subject line, a partnership banner) from a cohort's `sponsor`/`partnershipNote` fields via a small `CohortEmailInfo` shape, not the full `Cohort` type.

**Why:** Sponsored cohorts (e.g. DOREWA, delivered with the Kingdom of the Netherlands) need their own subject line and sponsor mention; cohorts without a `sponsor` (or no resolved cohort — legacy/unassigned applications) must fall back to the generic AFÁRÁ green template untouched.

**How to apply:** Only the confirmation and draft-save emails read this branding today. If acceptance/rejection or other cohort-aware emails are added, reuse the same `CohortEmailInfo`-shaped param and accent-color derivation for consistency rather than inventing a new pattern.

## Email HTML/subject building is split from sending, for admin previews
`server/email.ts` has private `build*Email(...)` functions (e.g. `buildApplicationConfirmationEmail`, `buildDraftSaveNotificationEmail`) that return `{ subject, html, mastheadBuffer }` without sending; the exported `send*` functions call them then hit Resend. Exported `render*EmailPreview(cohort)` wrappers call the same builders with `{ inlineImages: true }` so the masthead becomes a base64 data URI (real sends use `cid:` + an attachment, which doesn't render in a plain browser iframe).

**Why:** `GET /api/admin/cohorts/:id/email-preview?type=confirmation|draft-save` needs to return raw HTML an admin can view in an iframe before any applicant gets the real email — reusing the exact HTML-building code (not a re-implementation) is what guarantees the preview matches what actually gets sent.

**How to apply:** Any new cohort-branded email should follow this same split (build function + thin send wrapper + preview wrapper) rather than inlining HTML generation directly in the `send*` function, so it stays previewable the same way.

## Per-cohort trimmed application form (DOREWA)
`client/src/pages/Apply.tsx` supports a cohort-specific trimmed application flow, gated by `isDorewaLite = cohort?.slug === "dorewa"` (a hardcoded slug check, not a schema column/admin toggle).

**Why:** The user explicitly asked to keep this low-cost/low-token — DOREWA was the only cohort needing a different form, so a generic per-cohort form-builder (schema column + admin UI) was skipped in favor of the smallest working change. AFARA CORE's form must stay byte-for-byte the default behavior.

**How to apply:** When `isDorewaLite` is true: the Financial/Project/Support steps (ids 3/4/5) are skipped entirely (`hiddenStepIds`, filtered `visibleSteps`, `handleNext`/`handlePrevious` jump over them); several fields inside Personal/Background/Business are conditionally hidden; `subSectors` uses a 5-option DOREWA-specific list instead of the default 15; and the `whyAfaraIsRight` field is relabeled (not replaced) to ask about DOREWA's value to the applicant. `PreviewSection` mirrors the same hidden-step/hidden-field logic so the review screen doesn't show empty removed sections. This coexists independently with the generic custom-questions mechanism below — neither interacts with the other.

## Generic per-cohort custom application questions
Cohorts can define arbitrary extra questions (admin-editable), answered per-application, rendered as one additional step inserted into the public form only when a cohort has questions defined. Coexists independently with the DOREWA-lite hack above — neither interacts with the other.

**Why:** Unlike the DOREWA-lite hack, this needed to be admin-configurable per cohort (no code changes needed to add a cohort's custom questions) while leaving cohorts with none — e.g. AFARA CORE — completely unchanged.

**How to apply:** Never compare step identity by raw array index once a step can be conditionally inserted — resolve the active step by matching an id, and derive completion/progress from position within the *visible* step list, not from comparing raw ids (an inserted step's id can be out of visual order). Client-side validation of required answers is a UX convenience only; the authoritative check — required-ness, answer type, and (for single/limited-choice questions) membership in the configured option set — must be enforced server-side on every path that can transition an application to a final/submitted state, and any admin-defined question type that constrains valid values (e.g. select-from-options) must itself be validated to have enough options to be answerable, both at question-definition time and answer-submission time.
