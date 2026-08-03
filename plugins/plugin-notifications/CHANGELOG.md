# @baseplate-dev/plugin-notifications

## 1.0.8

### Patch Changes

- [#989](https://github.com/halfdomelabs/baseplate/pull/989) [`a232b6b`](https://github.com/halfdomelabs/baseplate/commit/a232b6b1a86b1c0f638c58ee561abc0c9433ce42) Thanks [@kingston](https://github.com/kingston)! - Notification types now require a `category` and render a single event by default, opting into batched rendering explicitly via `aggregate` — so a single-event renderer can no longer be handed a batch and silently render only the first. Renderers also receive the actor, snapshotted onto the row at notify time so it survives a rename or deletion.

- [#974](https://github.com/halfdomelabs/baseplate/pull/974) [`d41d590`](https://github.com/halfdomelabs/baseplate/commit/d41d590e28d281ac6cb80eb837e8c4eaac42591c) Thanks [@kingston](https://github.com/kingston)! - The notification feed is now cursor-paginated via a `notificationFeed` connection, so rows are no longer skipped or repeated when a notification arrives between page fetches.

- [#986](https://github.com/halfdomelabs/baseplate/pull/986) [`ecdccaa`](https://github.com/halfdomelabs/baseplate/commit/ecdccaa7ee48a8f7ee706ad6bb5dac809d741897) Thanks [@kingston](https://github.com/kingston)! - Notifications and their dispatch requests are now deleted after a retention window instead of accumulating forever, so the feed, badge count, and mark-all-as-read no longer degrade as a project ages. Rows still owing a delivery are kept until it settles.

- [#991](https://github.com/halfdomelabs/baseplate/pull/991) [`3785e88`](https://github.com/halfdomelabs/baseplate/commit/3785e88c3cdc2ae3160a1b266f5f5695d1292a13) Thanks [@kingston](https://github.com/kingston)! - Backend services are now split into a public `AppServices` tier reachable from request contexts and an `InternalServices` tier that only workers and scripts can reach, so a resolver naming an internal service is a compile error. The email transport and the notification outbox are now internal, so request-scoped code can no longer reach them to bypass their queues.

- [#974](https://github.com/halfdomelabs/baseplate/pull/974) [`d41d590`](https://github.com/halfdomelabs/baseplate/commit/d41d590e28d281ac6cb80eb837e8c4eaac42591c) Thanks [@kingston](https://github.com/kingston)! - Notifications are now delivered durably — deliveries survive a crash, retry with backoff, and go to many recipients at once via `notifyMany` — with emails rendered at send time so copy fixes reach mail that has not gone out, and clearing one from the feed no longer cancels its email. **Breaking:** the queue plugin is now required, `notify`/`notifyText` return `{ requestId }` instead of the created row, and custom channels receive the recipient and actor details from the service rather than querying for them.

- Updated dependencies [[`4c9acc4`](https://github.com/halfdomelabs/baseplate/commit/4c9acc48cc5b62aa3a642aef2ef3ed6d22fd2017), [`425d568`](https://github.com/halfdomelabs/baseplate/commit/425d568b1c98487b283fea7a65c429babc993da6), [`2ec1006`](https://github.com/halfdomelabs/baseplate/commit/2ec1006a5327ec48b5b1319e85d87f0885dddc95), [`3785e88`](https://github.com/halfdomelabs/baseplate/commit/3785e88c3cdc2ae3160a1b266f5f5695d1292a13), [`99fec21`](https://github.com/halfdomelabs/baseplate/commit/99fec214709952d17fb804832866d4bdc6bcc363), [`cc8dff2`](https://github.com/halfdomelabs/baseplate/commit/cc8dff2511ee87947b84401d2d9f37ba9cfa263b), [`eb22c19`](https://github.com/halfdomelabs/baseplate/commit/eb22c1994fa9e369b5b7b79b6394550889dd99b8), [`eb22c19`](https://github.com/halfdomelabs/baseplate/commit/eb22c1994fa9e369b5b7b79b6394550889dd99b8), [`3e3cf59`](https://github.com/halfdomelabs/baseplate/commit/3e3cf5967aadb12d473e509a5f225bbdaa79dc0e), [`380a4e2`](https://github.com/halfdomelabs/baseplate/commit/380a4e25f097f867e679b30993b5cb62ca8e8c79)]:
  - @baseplate-dev/react-generators@1.0.0
  - @baseplate-dev/core-generators@1.0.0
  - @baseplate-dev/fastify-generators@1.0.0
  - @baseplate-dev/plugin-email@1.0.0
  - @baseplate-dev/plugin-queue@1.0.0
  - @baseplate-dev/ui-components@1.0.0
  - @baseplate-dev/project-builder-lib@1.0.0
  - @baseplate-dev/sync@1.0.0
  - @baseplate-dev/utils@1.0.0

## 0.6.15

### Patch Changes

- [#962](https://github.com/halfdomelabs/baseplate/pull/962) [`615c8e1`](https://github.com/halfdomelabs/baseplate/commit/615c8e173cede3cfa0298b92d5b84999ffedce5b) Thanks [@kingston](https://github.com/kingston)! - Tightened handling of indexed access across the codebase, fixing latent cases where a missing array element or record entry could surface as an undefined value in a field typed as required, such as unmatched regular expression capture groups and parsed command strings.

- [#968](https://github.com/halfdomelabs/baseplate/pull/968) [`05bc90b`](https://github.com/halfdomelabs/baseplate/commit/05bc90b2d45cfb0cf286f756a065c3b71c9e4132) Thanks [@kingston](https://github.com/kingston)! - The notification feed is now cursor-paginated via a `notificationFeed` connection, so rows are no longer skipped or repeated when a notification arrives between page fetches.

- [#962](https://github.com/halfdomelabs/baseplate/pull/962) [`615c8e1`](https://github.com/halfdomelabs/baseplate/commit/615c8e173cede3cfa0298b92d5b84999ffedce5b) Thanks [@kingston](https://github.com/kingston)! - Generated projects now enable the `noUncheckedIndexedAccess` TypeScript compiler option, so indexed access such as `array[0]` or `record[key]` is typed as possibly undefined and must be handled explicitly. Existing projects will see new type errors on their next sync and should add the appropriate guards, defaults, or narrowing.

- Updated dependencies [[`403874a`](https://github.com/halfdomelabs/baseplate/commit/403874a10f67120eb36badc93920359cb267dcb5), [`615c8e1`](https://github.com/halfdomelabs/baseplate/commit/615c8e173cede3cfa0298b92d5b84999ffedce5b), [`8b2dfd7`](https://github.com/halfdomelabs/baseplate/commit/8b2dfd7aa799b51dfa02deeaf7592af8ea29ed7e), [`05cfe52`](https://github.com/halfdomelabs/baseplate/commit/05cfe5202692c8f3f3876d2e1c994c267d18d622), [`615c8e1`](https://github.com/halfdomelabs/baseplate/commit/615c8e173cede3cfa0298b92d5b84999ffedce5b), [`9cdfaa9`](https://github.com/halfdomelabs/baseplate/commit/9cdfaa9e3702c8a569c5dac739877dc8330a8f73), [`9139686`](https://github.com/halfdomelabs/baseplate/commit/91396867ec7832068aa6a5d19d038dcd1f04ec5c), [`e12d469`](https://github.com/halfdomelabs/baseplate/commit/e12d4699363b6d8c24c060929bec7b117933c8c2), [`e12d469`](https://github.com/halfdomelabs/baseplate/commit/e12d4699363b6d8c24c060929bec7b117933c8c2), [`15f4f2c`](https://github.com/halfdomelabs/baseplate/commit/15f4f2c6742bdde2b6a5f0b5f5063e01a053123e)]:
  - @baseplate-dev/fastify-generators@0.6.15
  - @baseplate-dev/project-builder-lib@0.6.15
  - @baseplate-dev/core-generators@0.6.15
  - @baseplate-dev/plugin-email@0.6.15
  - @baseplate-dev/react-generators@0.6.15
  - @baseplate-dev/sync@0.6.15
  - @baseplate-dev/utils@0.6.15
  - @baseplate-dev/ui-components@0.6.15

## 0.6.14

### Patch Changes

- Updated dependencies [[`e7ee500`](https://github.com/halfdomelabs/baseplate/commit/e7ee500e5a2d78778bd3bdb79b4f2f40b5f040ef), [`e7ee500`](https://github.com/halfdomelabs/baseplate/commit/e7ee500e5a2d78778bd3bdb79b4f2f40b5f040ef), [`e7ee500`](https://github.com/halfdomelabs/baseplate/commit/e7ee500e5a2d78778bd3bdb79b4f2f40b5f040ef)]:
  - @baseplate-dev/project-builder-lib@0.6.14
  - @baseplate-dev/fastify-generators@0.6.14
  - @baseplate-dev/plugin-email@0.6.14
  - @baseplate-dev/core-generators@0.6.14
  - @baseplate-dev/react-generators@0.6.14
  - @baseplate-dev/sync@0.6.14
  - @baseplate-dev/ui-components@0.6.14
  - @baseplate-dev/utils@0.6.14

## 0.6.13

### Patch Changes

- [#950](https://github.com/halfdomelabs/baseplate/pull/950) [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3) Thanks [@kingston](https://github.com/kingston)! - Generated backends now build a single app runtime composition root (`createAppRuntime()`) that constructs every application-scoped service — Redis, email, queues, storage, Stripe, pubsub, notifications, and auth sessions — once and disposes them together on shutdown, replacing the previous module-level singletons. Code reaches them through `ctx.services`, feature modules declare themselves with `defineAppModule()`, and `ServiceContext` splits into `ExecutionContext` (auth state) and `ServiceContext` (adds `services`), with `ServiceContextWith<K>`/`RequestServiceContextWith<K>` for narrowing a dependency to the services it actually uses. `createAppRuntime()` accepts an `overrides` map for supplying test doubles and a `backgroundServices` flag (default `false`) controlling whether the process runs queue supervision and scheduling, and `withScriptContext()` builds and safely disposes a runtime for one-off scripts and seeds.

- [#950](https://github.com/halfdomelabs/baseplate/pull/950) [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3) Thanks [@kingston](https://github.com/kingston)! - Added a native notification plugin (`@baseplate-dev/plugin-notifications`). Notification types are declared through `AppModule.notificationTypes` and delivered in-app over GraphQL subscriptions, or by email when the email plugin is enabled and a type lists `email` in its `channels`, rendering a branded notification email through the transactional email library. A `notification-web` generator provides a notification bell and feed panel with avatars, unread badges, and an optional "View All" link, enabled per web app and mounted through a new extension point in the generated admin layout header — the slot renders empty when no plugin contributes to it, so existing generated apps are unaffected. The plugin surfaces a clear error when enabled on a backend app that has GraphQL subscriptions disabled.

- [#927](https://github.com/halfdomelabs/baseplate/pull/927) [`0d3cd21`](https://github.com/halfdomelabs/baseplate/commit/0d3cd21bec022599977539f65fb2431d28574c83) Thanks [@kingston](https://github.com/kingston)! - Upgraded generated projects to TypeScript 6.0.3 (from 5.9.3), with typescript-eslint 8.65.0, `@vitest/eslint-plugin` 1.6.23, `eslint-plugin-perfectionist` 5.10.0, and `vitest-mock-extended` 3.1.1 for compatibility. Generated React apps now set `"types": ["node"]` in `tsconfig.app.json` and generated backends set `rootDir`/`types` in their `tsconfig.json`, since TypeScript 6 no longer implicitly includes `@types/node` globals for composite builds. Note that `@module-federation/vite` is pinned at exactly 1.17.0 — 1.17.1+ breaks the module federation shared-scope singleton for `zod`/`@baseplate-dev/project-builder-lib`, which left entity IDs unassigned when plugin-seeded models were merged into a new project during setup.

- [#940](https://github.com/halfdomelabs/baseplate/pull/940) [`13b78ca`](https://github.com/halfdomelabs/baseplate/commit/13b78caae04ad84441ca48d98a0b9e17135485d9) Thanks [@kingston](https://github.com/kingston)! - Web app per-app plugin settings (upload components, notifications) are now contributed by their plugins through a generic extension point and stored under `pluginData` on the web app config, instead of hardcoded flags on the core web app schema. The web app settings page renders these toggles only when the owning plugin is enabled. Existing projects are migrated automatically, preserving any enabled toggles; the unused `includeAuth` flag is removed.

- Updated dependencies [[`becf3c5`](https://github.com/halfdomelabs/baseplate/commit/becf3c52b87a775c3a988995385b174e42c0b9e4), [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3), [`80c1474`](https://github.com/halfdomelabs/baseplate/commit/80c1474f8903f0609f8d7484b0d0be8b59d4f6c0), [`ed5d784`](https://github.com/halfdomelabs/baseplate/commit/ed5d784a0edb2f794ae723ba3fb46a3768cade4c), [`45886a6`](https://github.com/halfdomelabs/baseplate/commit/45886a6fc3ac02f37bf19a3dae45d38186c9ad8a), [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3), [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3), [`03cc94e`](https://github.com/halfdomelabs/baseplate/commit/03cc94e0308d441404b4e84457e678b4d19c47b8), [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3), [`4819cfa`](https://github.com/halfdomelabs/baseplate/commit/4819cfad49158dec8eec05fc9d9b0025e7a81434), [`f596b4b`](https://github.com/halfdomelabs/baseplate/commit/f596b4b43bd9f0ecb7d5379739b0e36a01c40c70), [`80b7a20`](https://github.com/halfdomelabs/baseplate/commit/80b7a2090a06e5f729a798a7750ea126c8f27a8c), [`d0f8726`](https://github.com/halfdomelabs/baseplate/commit/d0f87265f16bfbde6c1525b0655850e906a7c3ed), [`47765e5`](https://github.com/halfdomelabs/baseplate/commit/47765e58ebd1979f94f0b1889efe539bcfe3e7f1), [`80c1474`](https://github.com/halfdomelabs/baseplate/commit/80c1474f8903f0609f8d7484b0d0be8b59d4f6c0), [`9548f2d`](https://github.com/halfdomelabs/baseplate/commit/9548f2d12af830e28187efed4b5a27d42020b289), [`e89c814`](https://github.com/halfdomelabs/baseplate/commit/e89c8143a7a4ea45817a45544fba6bf0ba6fe758), [`9030d45`](https://github.com/halfdomelabs/baseplate/commit/9030d45cd00ff8e3b9ea20744499457e25b0fbf4), [`0d3cd21`](https://github.com/halfdomelabs/baseplate/commit/0d3cd21bec022599977539f65fb2431d28574c83), [`13b78ca`](https://github.com/halfdomelabs/baseplate/commit/13b78caae04ad84441ca48d98a0b9e17135485d9)]:
  - @baseplate-dev/react-generators@0.6.13
  - @baseplate-dev/fastify-generators@0.6.13
  - @baseplate-dev/plugin-email@0.6.13
  - @baseplate-dev/utils@0.6.13
  - @baseplate-dev/core-generators@0.6.13
  - @baseplate-dev/project-builder-lib@0.6.13
  - @baseplate-dev/ui-components@0.6.13
  - @baseplate-dev/sync@0.6.13
