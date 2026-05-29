---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/plugin-rate-limit': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/plugin-payments': patch
'@baseplate-dev/plugin-observability': patch
'@baseplate-dev/plugin-ai': patch
---

Add `pluginDefaultsSpec` — a new platform spec that lets a plugin declare how to enable itself with sensible defaults. The setup wizard now invokes each plugin's registered builder instead of trying to enable with `{}`, which previously crashed Zod validation for plugins that require feature refs (rate-limit, storage). Rate-limit auto-scaffolds a `system/rate-limit` feature; storage auto-scaffolds a `storage` feature. Sentry, Stripe, and AI dev-agents register matching builders so the wizard treats every plugin uniformly.
