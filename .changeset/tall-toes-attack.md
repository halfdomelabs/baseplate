---
'@baseplate-dev/plugin-notifications': patch
---

Notifications are now delivered durably: deliveries survive a crash, retry with backoff, and can be sent to many recipients at once via `notifyMany` without slowing the caller. A notification row is now written for every channel with `inApp` marking the ones that appear in the feed, clearing one from the feed no longer cancels its email, and emails render when they are sent so copy fixes reach mail that has not gone out yet. **Breaking:** the queue plugin is now required, `notify`/`notifyText` return `{ requestId }` instead of the created row, and custom channels receive the recipient and actor details from the service rather than querying for them.
