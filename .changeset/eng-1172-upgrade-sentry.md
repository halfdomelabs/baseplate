---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/react-generators': patch
---

Upgrade Sentry to the latest 10.x release to resolve a memory leak:

- `@sentry/core`, `@sentry/node`, `@sentry/profiling-node`: 10.39.0 → 10.63.0
- `@sentry/react`: 10.39.0 → 10.63.0
