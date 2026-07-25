---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/plugin-notifications': patch
'@baseplate-dev/plugin-payments': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/plugin-email': patch
'@baseplate-dev/plugin-queue': patch
'@baseplate-dev/plugin-auth': patch
---

Redis, email, Stripe, storage, notifications, and BullMQ queues are now constructed once by the shared app runtime instead of as module-level singletons, so generated backends reach them through `ctx.services` and dispose them together on shutdown, with every Redis connection owned by a single connection manager.
