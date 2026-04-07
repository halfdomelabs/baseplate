# @baseplate-dev/plugin-payments

## 0.6.8

### Patch Changes

- Updated dependencies [[`04006df`](https://github.com/halfdomelabs/baseplate/commit/04006df7b2c9d124c83264d40aaeaa2a71558035), [`b231bca`](https://github.com/halfdomelabs/baseplate/commit/b231bcace5bd8395fe1cc92b2cb319302023342b)]:
  - @baseplate-dev/ui-components@0.6.8
  - @baseplate-dev/core-generators@0.6.8
  - @baseplate-dev/project-builder-lib@0.6.8
  - @baseplate-dev/fastify-generators@0.6.8
  - @baseplate-dev/sync@0.6.8
  - @baseplate-dev/utils@0.6.8

## 0.6.7

### Patch Changes

- Updated dependencies [[`2d39358`](https://github.com/halfdomelabs/baseplate/commit/2d39358510f73073a80ac78c3c7433a3aac2f0cd), [`335e063`](https://github.com/halfdomelabs/baseplate/commit/335e063b85676c9a55635ade6cf9b7b38bdd431d), [`c3a6719`](https://github.com/halfdomelabs/baseplate/commit/c3a67191d9a456d7440728f43f34cd02d28ffd12), [`2d39358`](https://github.com/halfdomelabs/baseplate/commit/2d39358510f73073a80ac78c3c7433a3aac2f0cd), [`2d39358`](https://github.com/halfdomelabs/baseplate/commit/2d39358510f73073a80ac78c3c7433a3aac2f0cd), [`7031c74`](https://github.com/halfdomelabs/baseplate/commit/7031c74af6a0ee74007a2b3cce30c738cff36e6a)]:
  - @baseplate-dev/core-generators@0.6.7
  - @baseplate-dev/ui-components@0.6.7
  - @baseplate-dev/fastify-generators@0.6.7
  - @baseplate-dev/project-builder-lib@0.6.7
  - @baseplate-dev/sync@0.6.7
  - @baseplate-dev/utils@0.6.7

## 0.6.6

### Patch Changes

- Updated dependencies [[`7cffc85`](https://github.com/halfdomelabs/baseplate/commit/7cffc85dfc2e9dc3ca6e1f243aeb874d2a1c5b13)]:
  - @baseplate-dev/fastify-generators@0.6.6
  - @baseplate-dev/core-generators@0.6.6
  - @baseplate-dev/project-builder-lib@0.6.6
  - @baseplate-dev/sync@0.6.6
  - @baseplate-dev/ui-components@0.6.6
  - @baseplate-dev/utils@0.6.6

## 0.6.5

### Patch Changes

- [#854](https://github.com/halfdomelabs/baseplate/pull/854) [`9708637`](https://github.com/halfdomelabs/baseplate/commit/97086370718861d2c3170ec6d83af84793fbd09e) Thanks [@kingston](https://github.com/kingston)! - Add optional description field to enum values that flows through to Pothos GraphQL enum type definitions

- [#851](https://github.com/halfdomelabs/baseplate/pull/851) [`53b8635`](https://github.com/halfdomelabs/baseplate/commit/53b86354ee6bc4b46d1966f657e3d6c942cf1eb1) Thanks [@kingston](https://github.com/kingston)! - Add plugin dependency support: plugins can declare `pluginDependencies` in plugin.json to require other plugins. Includes circular dependency detection via toposort, definition issue checking that blocks save for unmet dependencies, UI gating that prompts users to enable/configure dependencies before enabling a plugin, and implementation plugin validation. Added dependency declarations to local-auth (email, queue, rate-limit), email (queue), and storage (queue).

- [#865](https://github.com/halfdomelabs/baseplate/pull/865) [`c7131f5`](https://github.com/halfdomelabs/baseplate/commit/c7131f5caebda203ece99d30fcf2d58ead3abdb8) Thanks [@kingston](https://github.com/kingston)! - Update plugin model definitions to use `defaultGeneration: 'uuidv7'` for UUID primary key fields

- Updated dependencies [[`37b6d8f`](https://github.com/halfdomelabs/baseplate/commit/37b6d8fd76086dab2953e12e48543334c5056f15), [`860b82d`](https://github.com/halfdomelabs/baseplate/commit/860b82da0466386ad11128c619595179ee76d0a4), [`9708637`](https://github.com/halfdomelabs/baseplate/commit/97086370718861d2c3170ec6d83af84793fbd09e), [`9708637`](https://github.com/halfdomelabs/baseplate/commit/97086370718861d2c3170ec6d83af84793fbd09e), [`8dcf7b3`](https://github.com/halfdomelabs/baseplate/commit/8dcf7b3c909672487bad61b7a4465d1860092363), [`06f5173`](https://github.com/halfdomelabs/baseplate/commit/06f517371c4904482873a4e30fe9b23b4fd2e36d), [`c24a24a`](https://github.com/halfdomelabs/baseplate/commit/c24a24ac9d2b66623acb0fda9c6ff2b3b80c0a6d), [`9688ca3`](https://github.com/halfdomelabs/baseplate/commit/9688ca348fd995a228bff597069f58644d7e9459), [`71146cd`](https://github.com/halfdomelabs/baseplate/commit/71146cd1ab784f45e4409fef7e6e447750047e48), [`fc8f158`](https://github.com/halfdomelabs/baseplate/commit/fc8f1582f1702d2d6f6eaa60607da7bb777750b5), [`5e182c3`](https://github.com/halfdomelabs/baseplate/commit/5e182c308c51b8d6f735b213ae12ba475c34dbd2), [`0ba6744`](https://github.com/halfdomelabs/baseplate/commit/0ba67445708689622341f3031502b3308f71f68e), [`53b8635`](https://github.com/halfdomelabs/baseplate/commit/53b86354ee6bc4b46d1966f657e3d6c942cf1eb1), [`85d957d`](https://github.com/halfdomelabs/baseplate/commit/85d957d4a2ab4b3a55a96c8dbba9a79d2f72511c), [`8d30c14`](https://github.com/halfdomelabs/baseplate/commit/8d30c145ce5d72dcfc038ff076ed0746d2d763cc), [`ed5d250`](https://github.com/halfdomelabs/baseplate/commit/ed5d250146f0b48386a8208741150f9011892a35), [`efcf233`](https://github.com/halfdomelabs/baseplate/commit/efcf2338c018ad46b08e8fef3994630dea511723), [`2a514a6`](https://github.com/halfdomelabs/baseplate/commit/2a514a63e741e1b16b3b1b168b84a60965141887), [`497904a`](https://github.com/halfdomelabs/baseplate/commit/497904a9b5088171f95c5e16bcda542fb5e98610), [`87a2218`](https://github.com/halfdomelabs/baseplate/commit/87a2218266f957bb4beacd6b13cb3d610fd15a41), [`c7131f5`](https://github.com/halfdomelabs/baseplate/commit/c7131f5caebda203ece99d30fcf2d58ead3abdb8), [`adc5f55`](https://github.com/halfdomelabs/baseplate/commit/adc5f55dbf3a1451f4402cd6bd126e15f60b8ed8), [`c7131f5`](https://github.com/halfdomelabs/baseplate/commit/c7131f5caebda203ece99d30fcf2d58ead3abdb8), [`c7131f5`](https://github.com/halfdomelabs/baseplate/commit/c7131f5caebda203ece99d30fcf2d58ead3abdb8)]:
  - @baseplate-dev/project-builder-lib@0.6.5
  - @baseplate-dev/fastify-generators@0.6.5
  - @baseplate-dev/utils@0.6.5
  - @baseplate-dev/ui-components@0.6.5
  - @baseplate-dev/core-generators@0.6.5
  - @baseplate-dev/sync@0.6.5

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
