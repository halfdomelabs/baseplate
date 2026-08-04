---
'@baseplate-dev/plugin-notifications': patch
---

Notification preferences are now expressed over topics rather than categories, with a per-channel mode (off, immediate or digest) replacing the enabled flag, and notification types are declared with `defineNotificationType` or `defineBatchedNotificationType`. Existing preference rows are reset and `notifyMany` no longer accepts an `idempotencyKey`.
