# Threat Model

## Project Overview

AFÁRÁ is a publicly deployed React + Express platform for accelerator applications and an LMS/community portal. The production app serves a public marketing site, application workflow, email-driven account flows, authenticated participant/community features, and admin management features backed by PostgreSQL, session cookies, email delivery, and R2 object storage.

This scan assumes only production-reachable code matters. Mock/development-only behavior is out of scope unless it is reachable from the deployed Express server.

## Assets

- **User accounts and sessions** — email addresses, password hashes, reset tokens, session cookies, roles, and forced-password-change state. Compromise leads to impersonation or admin takeover.
- **Application data** — applicant identity details, phone numbers, company information, ownership and funding information, review notes, and uploaded business/financial document URLs. This is highly sensitive business and personal data.
- **LMS and community data** — mentorship records, enrollments, certificates, notifications, profiles, and community content. Unauthorized access or tampering affects program integrity and privacy.
- **Administrative capabilities** — user lifecycle actions, application review, content management, newsletter sending, and translation/testing endpoints. Abuse can impact the full platform.
- **Stored files and external service credentials** — uploaded files in R2 and email provider credentials. Exposure can leak private documents or enable unauthorized outbound mail.

## Trust Boundaries

- **Browser to Express API** — all request bodies, query parameters, headers, and cookies are untrusted until validated and authorized server-side.
- **Session boundary** — public endpoints, authenticated participant/community endpoints, admin endpoints, and superadmin-only endpoints must be enforced on the server, not just in React routing.
- **API to PostgreSQL** — the API has broad read/write access to application, user, and LMS data. Missing authorization at the API layer becomes full data compromise.
- **API to email services** — password reset, account onboarding, contact, and newsletter flows send user-controlled content and security links outside the system.
- **API to object storage** — uploaded documents and public file URLs cross from trusted server logic into externally retrievable storage.

## Scan Anchors

- **Production entry points:** `server/index.ts`, `server/routes.ts`, `server/auth.ts`, `server/storage.ts`, `server/email.ts`, `server/r2-storage.ts`.
- **Highest-risk code areas:** authentication/session setup, password reset and onboarding, application draft/status APIs, user/admin APIs, and any route returning raw `users` table rows.
- **Public surfaces:** marketing pages, application submission/status/draft flows, contact/newsletter, and many `GET/POST/PATCH` API routes under `/api`.
- **Authenticated/admin surfaces:** LMS/community routes in the client, plus `/api/admin/*`, `/api/users*`, `/api/resources*`, newsletter management, and application review endpoints.
- **Usually ignore unless production reachability changes:** Vite dev middleware and preview files under `client/src/preview`.

## Threat Categories

### Spoofing

This project relies on session cookies plus email/password login. The server must ensure sessions cannot be forged and that password reset/onboarding flows do not let an attacker assume another user’s identity. Any default credentials, predictable passwords, or user-controlled reset links are especially dangerous because the app is deployed on the public internet.

Required guarantees:
- Privileged and end-user accounts MUST never rely on hardcoded or predictable passwords in production.
- Password reset and onboarding flows MUST bind security links to trusted application origins only.
- Protected endpoints MUST require a valid session and MUST not trust client-side route guards as a security control.

### Tampering

The API exposes write endpoints for users, profiles, applications, courses, mentorship, notifications, certificates, and other LMS records. Because the browser is untrusted, every write path must validate both the shape of the payload and the caller’s authority to perform that exact change.

Required guarantees:
- Every write endpoint MUST enforce authentication and role/ownership checks server-side.
- Public self-service flows MUST only permit tightly scoped state transitions and field updates.
- Sensitive workflow fields such as roles, review notes, approval states, and system-generated identifiers MUST not be writable by untrusted callers.

### Information Disclosure

The platform stores sensitive applicant and participant data, including business documents and internal review information. Responses that expose raw user rows, application records, or private LMS data can directly leak credentials, reset tokens, and commercially sensitive information.

Required guarantees:
- API responses MUST return only the minimum fields needed for the caller’s role.
- Applicant records and document URLs MUST only be disclosed to the applicant or authorized staff.
- Password hashes, reset tokens, and similar secrets MUST never be returned by application APIs.

### Denial of Service

Public endpoints include login, forgot-password, contact, uploads, and application flows. Without abuse controls, these can be used for email flooding, repeated account actions, or heavy upload traffic.

Required guarantees:
- Public email-triggering and authentication endpoints SHOULD have rate limiting or equivalent abuse controls.
- Upload endpoints MUST enforce size and type limits and avoid unbounded processing.
- External requests from the server MUST use timeouts.

### Elevation of Privilege

The main privilege boundaries are public users vs authenticated community members/participants vs admins/superadmins. Missing auth checks, IDORs, or raw user-object disclosure can let low-privilege or unauthenticated attackers create privileged accounts, reset passwords, or alter protected records.

Required guarantees:
- Role assignment and user creation MUST be restricted to authorized administrative flows.
- Account recovery artifacts such as reset tokens MUST not be exposed to lower-privilege users.
- Admin and superadmin actions MUST be protected independently from general authenticated access.