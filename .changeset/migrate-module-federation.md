---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/ui-components': patch
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/plugin-ai': patch
'@baseplate-dev/plugin-email': patch
'@baseplate-dev/plugin-payments': patch
'@baseplate-dev/plugin-queue': patch
'@baseplate-dev/plugin-observability': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/plugin-rate-limit': patch
---

Migrate from @originjs/vite-plugin-federation to @module-federation/vite for active maintenance and Vite 7+ peer-range support. As part of this, `@baseplate-dev/project-builder-lib` and `@baseplate-dev/ui-components` now declare `react`, `react-dom`, `zod` (and `@baseplate-dev/ui-components` from project-builder-lib) as peer dependencies — these were already required by consumers but are now explicit, so the federation runtime can dedupe them across host and remotes.
