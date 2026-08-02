---
'@baseplate-dev/plugin-email': patch
---

The email transport is now an internal service, so request-scoped code can no longer reach it to bypass the send queue.
