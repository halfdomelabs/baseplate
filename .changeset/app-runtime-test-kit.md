---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/plugin-email': patch
'@baseplate-dev/plugin-notifications': patch
'@baseplate-dev/plugin-payments': patch
'@baseplate-dev/plugin-queue': patch
'@baseplate-dev/plugin-storage': patch
---

Every application-scoped dependency now lives on `AppServices` — including `queues`, `redis`, and `pubsub`, which were separate top-level `AppRuntime` fields — so access follows one path and `AppRuntime` is just the service graph plus its disposal. Fastify plugins receive `services` instead of a `runtime` wrapper and declare what they use (`{ services: Pick<AppServices, 'stripe'> }`), replacing the removed `PluginRuntime` and `PluginRuntimeWithServices` types. `createAppRuntime()` takes an `overrides` map for supplying services instead of constructing them, plus a `backgroundServices` boolean for whether this process runs pg-boss supervision and scheduling; it defaults to `false`, fixing scripts and integration tests silently starting queue maintenance. Hand-written plugins typed `{ runtime }` need updating to `{ services }`, and `createSystemServiceContext()` now takes services rather than a runtime.
