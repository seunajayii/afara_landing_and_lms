---
name: Playwright E2E environment
description: Runtime requirements and HTTP caching behavior relevant to browser validation
---

## Rule
The Replit Nix environment must include Chromium’s shared libraries for Playwright browser validation, and API assertions must account for Express conditional-cache responses.

**Why:** A browser binary can download successfully while failing to launch without system libraries such as glib and alsa-lib; Express may also return 304 for unchanged JSON, which Playwright does not classify as `response.ok()`.

**How to apply:** Keep the required browser libraries in the project environment configuration. For API checks, use a cache-busted/no-store request when the test needs a readable successful response, while still verifying the rendered UI.

Admin date/time popovers can be clipped by the scrollable dialog viewport, leaving calendar time options and Clear/Done controls outside the hit-test area. Browser checks for these controls should use the rendered trigger and option semantics, with DOM event clicks only for controls that are genuinely clipped.

**Why:** Playwright coordinate clicks can time out even when the control is rendered and the component handler is functional; forcing every click would hide real interaction regressions.

**How to apply:** Prefer normal role/test-id interactions, then scope to the active popover and use a DOM click only for the clipped control itself. Assert the popover closes before submitting the form.

## Isolated seeded fixtures
The run identifier for seeded fixtures must be created by the command that launches
Playwright and inherited by global setup, workers, and global teardown. Do not
generate it only while evaluating playwright.config.ts.

**Why:** Playwright can load its configuration in separate Node processes for
setup and teardown, so config-local randomness can create two manifests and
leave the first run's database rows behind.

**How to apply:** Set a fresh E2E_RUN_ID in the test script, require it for
seeded runs, and make teardown clean only the exact IDs recorded in that run's
manifest.