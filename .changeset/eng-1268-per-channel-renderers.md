---
'@baseplate-dev/plugin-notifications': patch
---

Notification types can now declare a custom email renderer via `renderers.email` alongside their existing `render`, so a type can send a bespoke React email template instead of the default wrapper while the in-app feed keeps rendering the same channel-neutral content; types that don't declare one are unaffected.
