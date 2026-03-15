# @baseplate-dev/plugin-payments

## 1.0.7

### Patch Changes

- [#829](https://github.com/halfdomelabs/baseplate/pull/829) [`28517d6`](https://github.com/halfdomelabs/baseplate/commit/28517d60059070943a3d1ebdb99d0a2fabbe30a7) Thanks [@kingston](https://github.com/kingston)! - Extract Stripe into standalone `@baseplate-dev/plugin-payments` package. Stripe is now managed through the plugin system instead of the `enableStripe` boolean on backend app config. Includes migration to automatically convert existing projects. Overhaul Stripe implementation to provide billing support.

- Updated dependencies [[`1115ba0`](https://github.com/halfdomelabs/baseplate/commit/1115ba082d2288db9f233c459dde3f32b890ff67), [`69483b8`](https://github.com/halfdomelabs/baseplate/commit/69483b8b703a2b568f9dfcfc349046bf3a2bb948), [`c175429`](https://github.com/halfdomelabs/baseplate/commit/c175429101d8e902e178067785f2840cd22347cb), [`fdd496d`](https://github.com/halfdomelabs/baseplate/commit/fdd496da00348cd56b329a50f60d94597e063045), [`28517d6`](https://github.com/halfdomelabs/baseplate/commit/28517d60059070943a3d1ebdb99d0a2fabbe30a7), [`168793d`](https://github.com/halfdomelabs/baseplate/commit/168793d958e001de2eb8bebed03c2b42397da701), [`34fc44e`](https://github.com/halfdomelabs/baseplate/commit/34fc44ec930c951c90edfbf2f658878a0cae8bb5), [`05b667f`](https://github.com/halfdomelabs/baseplate/commit/05b667fa0a21e78a6af3d553be1900f10e349c50), [`ad028b5`](https://github.com/halfdomelabs/baseplate/commit/ad028b5b840d5bf45f3597e95145b75b0e4eb2b7), [`d5e0b23`](https://github.com/halfdomelabs/baseplate/commit/d5e0b2397ce2aacacfd9663fb33d4176ec61ca61)]:
  - @baseplate-dev/ui-components@1.0.0
  - @baseplate-dev/fastify-generators@1.0.0
  - @baseplate-dev/project-builder-lib@1.0.0
  - @baseplate-dev/sync@1.0.0
  - @baseplate-dev/core-generators@1.0.0
  - @baseplate-dev/utils@1.0.0
