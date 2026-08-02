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

Generated projects now use current versions of their runtime dependencies (including Redis, queue, Stripe, logging, and file upload packages) and type against the Node version they declare. File uploads no longer reject legacy JPEG extensions such as `.jfif`, allowed-extension hints show `.jpg` instead of `.jpeg`, and an unrecognized Stripe subscription status now fails the webhook instead of being silently written.
