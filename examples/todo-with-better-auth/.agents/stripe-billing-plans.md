# Stripe Billing Plans

This project uses the `stripe` plugin to process payments and handle webhooks. Billing is enabled, so subscriptions are managed through **billing plans**.

## Configuring billing plans

Use the Baseplate MCP `configure-plugin` tool with `pluginKey: 'stripe'` to add or edit entries under `billing.plans`. Each plan has:

- **key** — kebab-case identifier for the plan, referenced by the Stripe price/product configuration in application code
- **displayName** — human-readable name shown to users
- **grantedRoles** — authorization roles granted to an account while it holds an active subscription to this plan

`billing.featureRef` controls which feature the generated billing module is placed under.

## How it works

- Subscribing/canceling in Stripe updates the account's granted roles via webhook handling generated into the billing module
- Role grants are idempotent and kept in sync with the subscription's current status

Run `sync-project` after committing changes to regenerate the billing module.
