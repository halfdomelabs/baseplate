---
'@baseplate-dev/core-generators': patch
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/react-generators': patch
'@baseplate-dev/project-builder-cli': patch
'@baseplate-dev/project-builder-dev': patch
'@baseplate-dev/plugin-payments': patch
'@baseplate-dev/plugin-queue': patch
'@baseplate-dev/plugin-rate-limit': patch
'@baseplate-dev/plugin-storage': patch
---

Generated projects now pin pnpm 11.18.0 and use current versions of their runtime dependencies, including major upgrades to bullmq, Stripe, pino, mime-types, react-dropzone and react-day-picker, so a synced project needs a fresh install and may need changes where it calls those libraries directly. File uploads also accept legacy JPEG extensions such as `.jfif` that were previously rejected, and an unrecognized Stripe subscription status now fails the webhook instead of writing a bad value.
