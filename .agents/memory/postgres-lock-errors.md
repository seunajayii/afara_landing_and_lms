---
name: PostgreSQL lock errors
description: Handling PostgreSQL lock-conflict errors through the Drizzle Neon adapter
---

PostgreSQL error codes used for API control flow may be wrapped in Drizzle’s query error rather than exposed on the top-level exception.

**Why:** A non-blocking row-lock conflict is returned by PostgreSQL as `55P03`, but the Neon Drizzle adapter wraps that provider error in a `cause`, so checking only the outer error turns an expected concurrency outcome into a 500 response.

**How to apply:** When translating PostgreSQL errors into domain outcomes, walk the `cause` chain and match the provider code instead of checking only the first exception object.