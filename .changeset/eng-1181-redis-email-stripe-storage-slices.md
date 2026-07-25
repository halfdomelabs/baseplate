---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/plugin-notifications': patch
'@baseplate-dev/plugin-payments': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/plugin-email': patch
'@baseplate-dev/plugin-queue': patch
'@baseplate-dev/plugin-auth': patch
---

Redis, email, Stripe, storage, and notifications are now constructed once by the shared app runtime instead of as module-level singletons, so generated backends allocate every client in one place and dispose them together on shutdown. Redis gains a `RedisRuntime` that hands out lazily-connecting connections and tears them all down, email splits into an `EmailService` for queueing and an `EmailTransport` for delivery, storage folds its adapter and file-category lookups into a single `StorageService` reading categories off `AppModule.storageCategories`, and notifications reach real-time pub/sub through an injected events port rather than a cached global. Feature code now reaches all of these through `ctx.services`, and `createAppRuntime()` performs no I/O, so scripts and tests can build a full service context cheaply.
