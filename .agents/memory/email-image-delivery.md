---
name: Email image delivery
description: Delivery and preview rule for uploaded newsletter images
---

Uploaded newsletter images should be kept in private object storage and attached inline to outgoing email with a CID reference. The admin preview can use an authenticated HTTPS asset endpoint, but the production email should not depend on a public image URL for uploaded assets.

**Why:** Gmail, Yahoo, and other clients may block remote images or require recipient interaction; inline attachments provide a more reliable first render while preserving private storage.

**How to apply:** Keep JPEG/PNG/GIF uploads size-limited, include an explicit content type and accessible alt text, and continue allowing external HTTPS image URLs as a fallback rather than treating them as equivalent to uploaded inline assets.