---
name: Resumable provider uploads
description: The reliability rule for browser uploads forwarded to an external resumable provider
---

Use an opaque, server-owned upload session for browser-to-provider resumable uploads. When a chunk request fails or its response is lost, query the provider for the committed byte range before sending the chunk again.

**Why:** A network failure does not tell the browser whether the provider committed the chunk, so blindly retrying the same range can duplicate or invalidate the upload.

**How to apply:** Keep provider session locations out of browser responses, bind the session to the initiating user, serialize status checks with chunk writes, and expire abandoned sessions.