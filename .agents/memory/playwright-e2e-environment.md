---
name: Playwright E2E environment
description: Runtime requirements and HTTP caching behavior relevant to browser validation
---

## Rule
The Replit Nix environment must include Chromium’s shared libraries for Playwright browser validation, and API assertions must account for Express conditional-cache responses.

**Why:** A browser binary can download successfully while failing to launch without system libraries such as glib and alsa-lib; Express may also return 304 for unchanged JSON, which Playwright does not classify as `response.ok()`.

**How to apply:** Keep the required browser libraries in the project environment configuration. For API checks, use a cache-busted/no-store request when the test needs a readable successful response, while still verifying the rendered UI.