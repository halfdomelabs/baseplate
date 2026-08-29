---
'@baseplate-dev/fastify-generators': patch
---

Generated backends now derive signing keys per purpose from a single `APP_SECRET`, so features needing signed tokens no longer each provision a secret of their own, and secrets retired into `APP_SECRET_PREVIOUS` keep verifying so rotating does not invalidate values already issued. `APP_SECRET` is required: set it in every deployed environment before upgrading, or the app will fail to start.
