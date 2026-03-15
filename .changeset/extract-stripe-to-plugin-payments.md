---
'@baseplate-dev/plugin-payments': patch
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/project-builder-common': patch
---

Extract Stripe into standalone `@baseplate-dev/plugin-payments` package. Stripe is now managed through the plugin system instead of the `enableStripe` boolean on backend app config. Includes migration to automatically convert existing projects. Overhaul Stripe implementation to provide billing support.
