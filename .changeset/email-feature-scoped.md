---
'@baseplate-dev/plugin-email': patch
---

The email plugin is now a feature-scoped module like storage: it requires an `emailFeatureRef` pointing at the feature the generated email module should live under, configurable from the plugin's settings form. Existing projects are migrated automatically, backfilling the reference against an `emails` feature. Outbound email is now sent through a queued worker (dispatched via the app runtime's queue service) instead of being sent synchronously inline.
