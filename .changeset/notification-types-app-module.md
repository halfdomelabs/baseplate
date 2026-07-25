---
'@baseplate-dev/plugin-notifications': patch
---

Notification types are now declared through `AppModule.notificationTypes` and collected into a per-runtime registry when the app runtime is constructed, instead of registering themselves as an import side effect into a module-level global.
