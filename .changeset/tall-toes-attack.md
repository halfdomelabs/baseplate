---
'@baseplate-dev/plugin-notifications': patch
---

Notifications are now delivered durably — deliveries survive a crash, retry with backoff, and go to many recipients at once via `notifyMany` — with emails rendered at send time so copy fixes reach mail that has not gone out, and clearing one from the feed no longer cancels its email. **Breaking:** the queue plugin is now required, `notify`/`notifyText` return `{ requestId }` instead of the created row, and custom channels receive the recipient and actor details from the service rather than querying for them.
