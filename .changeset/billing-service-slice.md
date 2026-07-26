---
'@baseplate-dev/plugin-payments': minor
---

Billing is now generated as a `BillingService` app-runtime service (`services.billing`) instead of free functions, and the Stripe webhook handler consumes it directly. Subscription role sync now reconciles roles from all of a billing account's subscriptions instead of diffing a single event, so moving between plans correctly grants and revokes roles. Webhook events with an unresolvable billing account, subscription item, or plan key now throw so Stripe retries the webhook, instead of silently succeeding while the local database falls out of sync with Stripe. Billing account creation now uses a per-user Stripe idempotency key and recovers from a concurrent-creation race instead of failing.
