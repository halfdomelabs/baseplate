---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/plugin-notifications': patch
'@baseplate-dev/plugin-payments': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/plugin-email': patch
'@baseplate-dev/plugin-queue': patch
'@baseplate-dev/plugin-auth': patch
---

Redis, email, Stripe, storage, and notifications are now constructed once by the shared app runtime instead of as module-level singletons, so generated backends allocate every client in one place, reach them through `ctx.services`, and dispose them together on shutdown; `createAppRuntime()` performs no I/O, so scripts and tests can build a full service context cheaply. Services are ordered by declared dependencies, so a missing or circular dependency now fails the build with a message naming the services involved instead of producing generated code that does not compile.
