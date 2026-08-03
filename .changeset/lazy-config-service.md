---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/plugin-email': patch
'@baseplate-dev/plugin-payments': patch
'@baseplate-dev/plugin-queue': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/plugin-observability': patch
---

Backend environment configuration is now exposed via a lazy `getConfig()` (plus an `isDevelopment()` helper) instead of a module-scope `config` constant, so backend modules can be imported by tooling and tests without a fully configured environment, and invalid configuration now fails with a readable list of the offending variables.
