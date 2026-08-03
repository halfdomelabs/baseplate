---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/plugin-email': patch
'@baseplate-dev/plugin-notifications': patch
---

Backend services are now split into a public `AppServices` tier reachable from request contexts and an `InternalServices` tier that only workers and scripts can reach, so a resolver naming an internal service is a compile error. The email transport and the notification outbox are now internal, so request-scoped code can no longer reach them to bypass their queues.
