---
'@baseplate-dev/fastify-generators': patch
---

Generated backends now expose a queue slot on the app runtime: `AppRuntime`/`RuntimeServices` gain a `queues` field constructed from queue bindings contributed by feature modules, and `AppModule` gains a `plugins` runtime-typed registration so Fastify plugins can receive `{ runtime }` and read `runtime.services` directly instead of importing singletons.
