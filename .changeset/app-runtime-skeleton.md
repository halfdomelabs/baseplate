---
'@baseplate-dev/fastify-generators': patch
---

Generated backends now construct a single app runtime composition root (`createAppRuntime()`) that owns disposal of shared services, delivered to code via `ctx.services` on the service context. `ServiceContext` is now split into `ExecutionContext` (auth/authorizer state only) and `ServiceContext extends ExecutionContext` (adds `services`), with a new `ServiceContextWith<K>` type for narrowing dependencies to only the services actually used. Feature modules declare themselves via `defineAppModule()` instead of `satisfies AppModule`, and only the root module flattens the tree. A new `withScriptContext()` helper constructs and safely disposes a runtime for one-off scripts and seeds.
