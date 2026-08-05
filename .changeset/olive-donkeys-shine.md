---
'@baseplate-dev/plugin-notifications': patch
---

Notification types are now declared with `defineNotificationType` or `defineBatchedNotificationType`, with topic-based per-channel preferences (off, immediate or digest), keyed collapse-and-retract so repeat activity updates one feed row in place, and per-channel email renderers. Generated apps gain a `notificationPreferences` query plus mutations to set and clear a preference, and a migration adds an index to the notification delivery table. **Breaking:** types now declare topics instead of a `category`, and renderers no longer receive an actor — whoever triggered a notification travels in `params`.
