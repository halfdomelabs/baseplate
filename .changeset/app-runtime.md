---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/plugin-email': patch
'@baseplate-dev/plugin-notifications': patch
'@baseplate-dev/plugin-payments': patch
'@baseplate-dev/plugin-queue': patch
'@baseplate-dev/plugin-storage': patch
---

Generated backends now build a single app runtime composition root (`createAppRuntime()`) that constructs every application-scoped service — Redis, email, queues, storage, Stripe, pubsub, notifications, and auth sessions — once and disposes them together on shutdown, replacing the previous module-level singletons. Code reaches them through `ctx.services`, feature modules declare themselves with `defineAppModule()`, and `ServiceContext` splits into `ExecutionContext` (auth state) and `ServiceContext` (adds `services`), with `ServiceContextWith<K>`/`RequestServiceContextWith<K>` for narrowing a dependency to the services it actually uses. `createAppRuntime()` accepts an `overrides` map for supplying test doubles and a `backgroundServices` flag (default `false`) controlling whether the process runs queue supervision and scheduling, and `withScriptContext()` builds and safely disposes a runtime for one-off scripts and seeds.
