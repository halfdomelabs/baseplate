# @baseplate-dev/plugin-payments

## 0.6.13

### Patch Changes

- [#950](https://github.com/halfdomelabs/baseplate/pull/950) [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3) Thanks [@kingston](https://github.com/kingston)! - Generated backends now build a single app runtime composition root (`createAppRuntime()`) that constructs every application-scoped service — Redis, email, queues, storage, Stripe, pubsub, notifications, and auth sessions — once and disposes them together on shutdown, replacing the previous module-level singletons. Code reaches them through `ctx.services`, feature modules declare themselves with `defineAppModule()`, and `ServiceContext` splits into `ExecutionContext` (auth state) and `ServiceContext` (adds `services`), with `ServiceContextWith<K>`/`RequestServiceContextWith<K>` for narrowing a dependency to the services it actually uses. `createAppRuntime()` accepts an `overrides` map for supplying test doubles and a `backgroundServices` flag (default `false`) controlling whether the process runs queue supervision and scheduling, and `withScriptContext()` builds and safely disposes a runtime for one-off scripts and seeds.

- [#948](https://github.com/halfdomelabs/baseplate/pull/948) [`9391135`](https://github.com/halfdomelabs/baseplate/commit/9391135fa48ccb743b82dddbf536fafe454fb285) Thanks [@kingston](https://github.com/kingston)! - Billing is now generated as a `BillingService` app-runtime service (`services.billing`) instead of free functions, and the Stripe webhook handler consumes it directly. Subscription role sync now reconciles roles from all of a billing account's subscriptions instead of diffing a single event, so moving between plans correctly grants and revokes roles. Webhook events with an unresolvable billing account, subscription item, or plan key now throw so Stripe retries the webhook, instead of silently succeeding while the local database falls out of sync with Stripe. Billing account creation now uses a per-user Stripe idempotency key and recovers from a concurrent-creation race instead of failing.

- Updated dependencies [[`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3), [`80c1474`](https://github.com/halfdomelabs/baseplate/commit/80c1474f8903f0609f8d7484b0d0be8b59d4f6c0), [`45886a6`](https://github.com/halfdomelabs/baseplate/commit/45886a6fc3ac02f37bf19a3dae45d38186c9ad8a), [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3), [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3), [`03cc94e`](https://github.com/halfdomelabs/baseplate/commit/03cc94e0308d441404b4e84457e678b4d19c47b8), [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3), [`4819cfa`](https://github.com/halfdomelabs/baseplate/commit/4819cfad49158dec8eec05fc9d9b0025e7a81434), [`f596b4b`](https://github.com/halfdomelabs/baseplate/commit/f596b4b43bd9f0ecb7d5379739b0e36a01c40c70), [`d0f8726`](https://github.com/halfdomelabs/baseplate/commit/d0f87265f16bfbde6c1525b0655850e906a7c3ed), [`47765e5`](https://github.com/halfdomelabs/baseplate/commit/47765e58ebd1979f94f0b1889efe539bcfe3e7f1), [`80c1474`](https://github.com/halfdomelabs/baseplate/commit/80c1474f8903f0609f8d7484b0d0be8b59d4f6c0), [`9548f2d`](https://github.com/halfdomelabs/baseplate/commit/9548f2d12af830e28187efed4b5a27d42020b289), [`e89c814`](https://github.com/halfdomelabs/baseplate/commit/e89c8143a7a4ea45817a45544fba6bf0ba6fe758), [`9030d45`](https://github.com/halfdomelabs/baseplate/commit/9030d45cd00ff8e3b9ea20744499457e25b0fbf4), [`0d3cd21`](https://github.com/halfdomelabs/baseplate/commit/0d3cd21bec022599977539f65fb2431d28574c83), [`13b78ca`](https://github.com/halfdomelabs/baseplate/commit/13b78caae04ad84441ca48d98a0b9e17135485d9)]:
  - @baseplate-dev/fastify-generators@0.6.13
  - @baseplate-dev/utils@0.6.13
  - @baseplate-dev/core-generators@0.6.13
  - @baseplate-dev/project-builder-lib@0.6.13
  - @baseplate-dev/ui-components@0.6.13
  - @baseplate-dev/sync@0.6.13

## 0.6.12

### Patch Changes

- Updated dependencies [[`0620a2b`](https://github.com/halfdomelabs/baseplate/commit/0620a2b2a59a4b401a9d9268f596776f4da09a9b), [`0620a2b`](https://github.com/halfdomelabs/baseplate/commit/0620a2b2a59a4b401a9d9268f596776f4da09a9b), [`0620a2b`](https://github.com/halfdomelabs/baseplate/commit/0620a2b2a59a4b401a9d9268f596776f4da09a9b), [`0620a2b`](https://github.com/halfdomelabs/baseplate/commit/0620a2b2a59a4b401a9d9268f596776f4da09a9b), [`0620a2b`](https://github.com/halfdomelabs/baseplate/commit/0620a2b2a59a4b401a9d9268f596776f4da09a9b), [`65a1b96`](https://github.com/halfdomelabs/baseplate/commit/65a1b969e7900b935800d111c23b3af70a660514)]:
  - @baseplate-dev/fastify-generators@0.6.12
  - @baseplate-dev/core-generators@0.6.12
  - @baseplate-dev/project-builder-lib@0.6.12
  - @baseplate-dev/sync@0.6.12
  - @baseplate-dev/ui-components@0.6.12
  - @baseplate-dev/utils@0.6.12

## 0.6.11

### Patch Changes

- Updated dependencies [[`cc296f4`](https://github.com/halfdomelabs/baseplate/commit/cc296f4737d0462f3536dda27ae9eb297f799b8b), [`05e7b98`](https://github.com/halfdomelabs/baseplate/commit/05e7b98c84069284976b33dfc3426a71a5b9bc64)]:
  - @baseplate-dev/core-generators@0.6.11
  - @baseplate-dev/project-builder-lib@0.6.11
  - @baseplate-dev/fastify-generators@0.6.11
  - @baseplate-dev/sync@0.6.11
  - @baseplate-dev/ui-components@0.6.11
  - @baseplate-dev/utils@0.6.11

## 0.6.10

### Patch Changes

- [#886](https://github.com/halfdomelabs/baseplate/pull/886) [`30765f0`](https://github.com/halfdomelabs/baseplate/commit/30765f079c46019d9c91fb96f1b3c399b4dc8759) Thanks [@kingston](https://github.com/kingston)! - Migrate from @originjs/vite-plugin-federation to @module-federation/vite for active maintenance and Vite 7+ peer-range support. As part of this, `@baseplate-dev/project-builder-lib` and `@baseplate-dev/ui-components` now declare `react`, `react-dom`, `zod` (and `@baseplate-dev/ui-components` from project-builder-lib) as peer dependencies — these were already required by consumers but are now explicit, so the federation runtime can dedupe them across host and remotes.

- [#894](https://github.com/halfdomelabs/baseplate/pull/894) [`4b38b79`](https://github.com/halfdomelabs/baseplate/commit/4b38b79282a32414c688b1f6212b88c0c75d413d) Thanks [@kingston](https://github.com/kingston)! - Add `pluginDefaultsSpec` — a new platform spec that lets a plugin declare how to enable itself with sensible defaults. The setup wizard now invokes each plugin's registered builder instead of trying to enable with `{}`, which previously crashed Zod validation for plugins that require feature refs (rate-limit, storage). Rate-limit auto-scaffolds a `system/rate-limit` feature; storage auto-scaffolds a `storage` feature. Sentry, Stripe, and AI dev-agents register matching builders so the wizard treats every plugin uniformly.

- Updated dependencies [[`f5ad6d2`](https://github.com/halfdomelabs/baseplate/commit/f5ad6d2ff994ecdd03f790b7e5c0915ddc7660c5), [`db93095`](https://github.com/halfdomelabs/baseplate/commit/db93095c6a9846d1e583832b70b85898ae785b10), [`ffe0818`](https://github.com/halfdomelabs/baseplate/commit/ffe081872b7c99124243e3bb04e73c7b5ddd0f7e), [`30765f0`](https://github.com/halfdomelabs/baseplate/commit/30765f079c46019d9c91fb96f1b3c399b4dc8759), [`4b38b79`](https://github.com/halfdomelabs/baseplate/commit/4b38b79282a32414c688b1f6212b88c0c75d413d), [`58d7c6b`](https://github.com/halfdomelabs/baseplate/commit/58d7c6bc433021e543e65817bf75582654ad4d42), [`4b38b79`](https://github.com/halfdomelabs/baseplate/commit/4b38b79282a32414c688b1f6212b88c0c75d413d), [`0afcb97`](https://github.com/halfdomelabs/baseplate/commit/0afcb979943a6f4f571c56af5e73936ed9d40370), [`62df439`](https://github.com/halfdomelabs/baseplate/commit/62df43917263034e621f29fb261d2b93ca9edf23), [`e8da347`](https://github.com/halfdomelabs/baseplate/commit/e8da347b3bd799b31c5d04d1317dedaa8c14e412), [`f9fe0c2`](https://github.com/halfdomelabs/baseplate/commit/f9fe0c20f16bf3495129aa859340dd689500cc1e), [`f5ad6d2`](https://github.com/halfdomelabs/baseplate/commit/f5ad6d2ff994ecdd03f790b7e5c0915ddc7660c5), [`f9fe0c2`](https://github.com/halfdomelabs/baseplate/commit/f9fe0c20f16bf3495129aa859340dd689500cc1e), [`f5ad6d2`](https://github.com/halfdomelabs/baseplate/commit/f5ad6d2ff994ecdd03f790b7e5c0915ddc7660c5), [`62df439`](https://github.com/halfdomelabs/baseplate/commit/62df43917263034e621f29fb261d2b93ca9edf23), [`c1e8765`](https://github.com/halfdomelabs/baseplate/commit/c1e8765fb3b59f56db4bc393e7469a54332c94b8)]:
  - @baseplate-dev/sync@0.6.10
  - @baseplate-dev/core-generators@0.6.10
  - @baseplate-dev/project-builder-lib@0.6.10
  - @baseplate-dev/fastify-generators@0.6.10
  - @baseplate-dev/ui-components@0.6.10
  - @baseplate-dev/utils@0.6.10

## 0.6.9

### Patch Changes

- Updated dependencies [[`7677630`](https://github.com/halfdomelabs/baseplate/commit/7677630f1e445e2c8c8c56b70435d12b0242affb)]:
  - @baseplate-dev/core-generators@0.6.9
  - @baseplate-dev/fastify-generators@0.6.9
  - @baseplate-dev/project-builder-lib@0.6.9
  - @baseplate-dev/sync@0.6.9
  - @baseplate-dev/ui-components@0.6.9
  - @baseplate-dev/utils@0.6.9

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
