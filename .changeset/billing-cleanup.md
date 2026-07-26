---
'@baseplate-dev/plugin-email': minor
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/plugin-notifications': patch
'@baseplate-dev/fastify-generators': patch
---

Removed the redundant `sendEmail()` wrapper from generated email modules; call sites now use `ctx.services.emails.send(...)` directly. Added `RequestServiceContextWith<K>`, a narrowed request-scoped context type mirroring `ServiceContextWith<K>`, and used it to narrow the email-flow auth services and one storage service to the services they actually use. Cleaned up stale and narrative comments in the notification and email modules.
