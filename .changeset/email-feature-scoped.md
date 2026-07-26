---
'@baseplate-dev/plugin-email': patch
---

The email plugin is now a feature-scoped module like storage: it requires an `emailFeatureRef` pointing at the feature the generated email module should live under, configurable from the plugin's settings form, and existing projects are migrated automatically by backfilling the reference against an `emails` feature. The Postmark, Resend, and stub adapters generate under that feature alongside the email service (e.g. `modules/emails/services/postmark.adapter.ts`) rather than at the app root. Outbound email is sent through a queued worker dispatched via the app runtime's queue service instead of synchronously inline, and call sites send through `ctx.services.email.send(...)` directly.
