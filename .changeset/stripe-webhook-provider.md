---
'@baseplate-dev/plugin-payments': patch
'@baseplate-dev/plugin-rate-limit': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/ui-components': patch
---

Move Stripe webhook infrastructure into `fastify-stripe` generator and add `stripeWebhookConfigProvider` so any module can register Stripe event handlers without requiring the billing module to be enabled. Fix feature reference save logic in plugin definition editors (payments, rate-limit, storage) to correctly persist feature IDs. Add `resolveFeatureName`, `createPartialFeatures`, and `getFeatureIdByNameOrThrow` to `FeatureUtils` in `project-builder-lib`. Add `inputValue` prop to `ComboboxField` for controlled input state.
