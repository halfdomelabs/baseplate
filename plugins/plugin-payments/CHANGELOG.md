# @baseplate-dev/plugin-payments

## 0.6.4

### Patch Changes

- [#837](https://github.com/halfdomelabs/baseplate/pull/837) [`ba315aa`](https://github.com/halfdomelabs/baseplate/commit/ba315aaaec0e8842ec7fadb765b1fed5e3abda5a) Thanks [@kingston](https://github.com/kingston)! - Move Stripe webhook infrastructure into `fastify-stripe` generator and add `stripeWebhookConfigProvider` so any module can register Stripe event handlers without requiring the billing module to be enabled. Fix feature reference save logic in plugin definition editors (payments, rate-limit, storage) to correctly persist feature IDs.

- Updated dependencies [[`ba315aa`](https://github.com/halfdomelabs/baseplate/commit/ba315aaaec0e8842ec7fadb765b1fed5e3abda5a), [`ba315aa`](https://github.com/halfdomelabs/baseplate/commit/ba315aaaec0e8842ec7fadb765b1fed5e3abda5a)]:
  - @baseplate-dev/ui-components@0.6.4
  - @baseplate-dev/project-builder-lib@0.6.4
  - @baseplate-dev/core-generators@0.6.4
  - @baseplate-dev/fastify-generators@0.6.4
  - @baseplate-dev/sync@0.6.4
  - @baseplate-dev/utils@0.6.4

## 0.6.3

### Patch Changes

- [#835](https://github.com/halfdomelabs/baseplate/pull/835) [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931) Thanks [@kingston](https://github.com/kingston)! - Extract Stripe into standalone `@baseplate-dev/plugin-payments` package. Stripe is now managed through the plugin system instead of the `enableStripe` boolean on backend app config. Includes migration to automatically convert existing projects. Overhaul Stripe implementation to provide billing support.

- Updated dependencies [[`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931)]:
  - @baseplate-dev/ui-components@0.6.3
  - @baseplate-dev/fastify-generators@0.6.3
  - @baseplate-dev/project-builder-lib@0.6.3
  - @baseplate-dev/sync@0.6.3
  - @baseplate-dev/core-generators@0.6.3
  - @baseplate-dev/utils@0.6.3
