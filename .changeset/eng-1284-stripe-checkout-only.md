---
'@baseplate-dev/plugin-payments': patch
---

Fixed the Stripe plugin's generated webhook event-handler factory so checkout-only projects (billing disabled) no longer emit an unused parameter that fails lint.
