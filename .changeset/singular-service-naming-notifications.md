---
'@baseplate-dev/plugin-notifications': patch
---

Renamed the `services.notifications` app-runtime key to `services.notification` for consistency with the codebase's singular service-naming convention, and updated the email channel to consume the renamed `services.email` key.
