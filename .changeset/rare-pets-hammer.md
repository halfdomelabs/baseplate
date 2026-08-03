---
'@baseplate-dev/plugin-notifications': patch
---

Notification types are now grouped into categories you declare in the project builder, and a fan-out delivers to each recipient only on the channels their preferences still allow. Generated apps gain a `notificationPreferences` query plus mutations to set and clear a preference, so a settings page can be built without writing backend code.
