---
'@baseplate-dev/plugin-notifications': patch
---

Notifications are now delivered through a durable outbox: deliveries survive a crash, retry on failure, and can be triggered for many recipients at once via `notifyMany` without slowing the caller. Emails render when they are sent rather than when the notification is written, so copy fixes reach mail that has not gone out yet. **Breaking:** the queue plugin is now a required dependency, the `Notification` model is now `NotificationFeedItem`, and `notify`/`notifyText` return `{ requestId }` instead of the created row.
