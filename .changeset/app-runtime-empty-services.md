---
'@baseplate-dev/fastify-generators': patch
---

Generated backends with no application services registered (no redis, email, queues, etc.) no longer emit dead code in `createAppRuntime()`, the health-check plugin, or the test service-context helper — the `provide`/`overrides` machinery, the `services` plugin option, and an unnecessary type assertion are now omitted rather than generated unreachable, which previously failed lint.
