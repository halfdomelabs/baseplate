# @baseplate-dev/plugin-email

## 0.6.18

### Patch Changes

- [#1023](https://github.com/halfdomelabs/baseplate/pull/1023) [`865e976`](https://github.com/halfdomelabs/baseplate/commit/865e97651f2306580f21532a939dc317d53bf4f8) Thanks [@kingston](https://github.com/kingston)! - Local auth can now offer passwordless sign-in with a single-use code emailed to the user, enabled with the new "Email Sign-in Codes" setting. Existing local auth projects pick up a schema change and will need a database migration on their next sync.

- Updated dependencies [[`eeff7b5`](https://github.com/halfdomelabs/baseplate/commit/eeff7b5895155dc252720d70ced0eca64272ad6a), [`ce52092`](https://github.com/halfdomelabs/baseplate/commit/ce5209240d4163966967f60cc9fa6286c4f8dcbb), [`e766854`](https://github.com/halfdomelabs/baseplate/commit/e766854f565d24003c7d4adc8011445953713917), [`6f6e083`](https://github.com/halfdomelabs/baseplate/commit/6f6e0834b3963046e91e509fc6638130f290428e), [`6f6e083`](https://github.com/halfdomelabs/baseplate/commit/6f6e0834b3963046e91e509fc6638130f290428e), [`6f6e083`](https://github.com/halfdomelabs/baseplate/commit/6f6e0834b3963046e91e509fc6638130f290428e), [`8285b67`](https://github.com/halfdomelabs/baseplate/commit/8285b67d1627e0b4200d716ebdce6accc7fd67a1), [`865e976`](https://github.com/halfdomelabs/baseplate/commit/865e97651f2306580f21532a939dc317d53bf4f8), [`a091468`](https://github.com/halfdomelabs/baseplate/commit/a091468889619613d028db530acd42f7ab476d58), [`ff22f21`](https://github.com/halfdomelabs/baseplate/commit/ff22f21b3d92705b904fdacb90819bb3bdd6c303), [`93aee4f`](https://github.com/halfdomelabs/baseplate/commit/93aee4f95c4cef9e16e08e1934ccae2d5d3f3ce6)]:
  - @baseplate-dev/utils@0.6.18
  - @baseplate-dev/sync@0.6.18
  - @baseplate-dev/core-generators@0.6.18
  - @baseplate-dev/fastify-generators@0.6.18
  - @baseplate-dev/react-generators@0.6.18
  - @baseplate-dev/ui-components@0.6.18
  - @baseplate-dev/project-builder-lib@0.6.18
  - @baseplate-dev/plugin-queue@0.6.18

## 0.6.17

### Patch Changes

- Updated dependencies [[`b202a97`](https://github.com/halfdomelabs/baseplate/commit/b202a9772434de41a2abcc73c4c96e6f1ddab7c0), [`bd82e72`](https://github.com/halfdomelabs/baseplate/commit/bd82e727543a5ed1582ff0c15a8a39914865d3ca), [`ae275d0`](https://github.com/halfdomelabs/baseplate/commit/ae275d0d5d58c0b3d0cee41786938b8069d5e4bc), [`f5c5282`](https://github.com/halfdomelabs/baseplate/commit/f5c528261e829967951d19c6b2f9fa59ae686c21), [`f5c5282`](https://github.com/halfdomelabs/baseplate/commit/f5c528261e829967951d19c6b2f9fa59ae686c21), [`dd758d3`](https://github.com/halfdomelabs/baseplate/commit/dd758d3a3639e476056a0829d28a58ef8a8f1ff4), [`b202a97`](https://github.com/halfdomelabs/baseplate/commit/b202a9772434de41a2abcc73c4c96e6f1ddab7c0)]:
  - @baseplate-dev/core-generators@0.6.17
  - @baseplate-dev/react-generators@0.6.17
  - @baseplate-dev/fastify-generators@0.6.17
  - @baseplate-dev/plugin-queue@0.6.17
  - @baseplate-dev/project-builder-lib@0.6.17
  - @baseplate-dev/sync@0.6.17
  - @baseplate-dev/ui-components@0.6.17
  - @baseplate-dev/utils@0.6.17

## 0.6.16

### Patch Changes

- [#994](https://github.com/halfdomelabs/baseplate/pull/994) [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552) Thanks [@kingston](https://github.com/kingston)! - Backend environment configuration is now exposed via a lazy `getConfig()` (plus an `isDevelopment()` helper) instead of a module-scope `config` constant, so backend modules can be imported by tooling and tests without a fully configured environment, and invalid configuration now fails with a readable list of the offending variables.

- [#994](https://github.com/halfdomelabs/baseplate/pull/994) [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552) Thanks [@kingston](https://github.com/kingston)! - Backend services are now split into a public `AppServices` tier reachable from request contexts and an `InternalServices` tier that only workers and scripts can reach, so a resolver naming an internal service is a compile error. The email transport and the notification outbox are now internal, so request-scoped code can no longer reach them to bypass their queues.

- Updated dependencies [[`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552), [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552), [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552), [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552), [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552), [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552), [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552), [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552), [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552), [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552)]:
  - @baseplate-dev/react-generators@0.6.16
  - @baseplate-dev/core-generators@0.6.16
  - @baseplate-dev/fastify-generators@0.6.16
  - @baseplate-dev/plugin-queue@0.6.16
  - @baseplate-dev/ui-components@0.6.16
  - @baseplate-dev/project-builder-lib@0.6.16
  - @baseplate-dev/sync@0.6.16
  - @baseplate-dev/utils@0.6.16

## 0.6.15

### Patch Changes

- [#962](https://github.com/halfdomelabs/baseplate/pull/962) [`615c8e1`](https://github.com/halfdomelabs/baseplate/commit/615c8e173cede3cfa0298b92d5b84999ffedce5b) Thanks [@kingston](https://github.com/kingston)! - Tightened handling of indexed access across the codebase, fixing latent cases where a missing array element or record entry could surface as an undefined value in a field typed as required, such as unmatched regular expression capture groups and parsed command strings.

- [#962](https://github.com/halfdomelabs/baseplate/pull/962) [`615c8e1`](https://github.com/halfdomelabs/baseplate/commit/615c8e173cede3cfa0298b92d5b84999ffedce5b) Thanks [@kingston](https://github.com/kingston)! - Generated projects now enable the `noUncheckedIndexedAccess` TypeScript compiler option, so indexed access such as `array[0]` or `record[key]` is typed as possibly undefined and must be handled explicitly. Existing projects will see new type errors on their next sync and should add the appropriate guards, defaults, or narrowing.

- Updated dependencies [[`403874a`](https://github.com/halfdomelabs/baseplate/commit/403874a10f67120eb36badc93920359cb267dcb5), [`615c8e1`](https://github.com/halfdomelabs/baseplate/commit/615c8e173cede3cfa0298b92d5b84999ffedce5b), [`8b2dfd7`](https://github.com/halfdomelabs/baseplate/commit/8b2dfd7aa799b51dfa02deeaf7592af8ea29ed7e), [`dac747d`](https://github.com/halfdomelabs/baseplate/commit/dac747d5085f82de33bc4cc66ef0709fc405cccd), [`4ed5ae3`](https://github.com/halfdomelabs/baseplate/commit/4ed5ae379ec7097d072612fa9c29738947b11334), [`05cfe52`](https://github.com/halfdomelabs/baseplate/commit/05cfe5202692c8f3f3876d2e1c994c267d18d622), [`3184ab4`](https://github.com/halfdomelabs/baseplate/commit/3184ab40137515c7c96249793ca882526055292d), [`615c8e1`](https://github.com/halfdomelabs/baseplate/commit/615c8e173cede3cfa0298b92d5b84999ffedce5b), [`9cdfaa9`](https://github.com/halfdomelabs/baseplate/commit/9cdfaa9e3702c8a569c5dac739877dc8330a8f73), [`9139686`](https://github.com/halfdomelabs/baseplate/commit/91396867ec7832068aa6a5d19d038dcd1f04ec5c), [`e12d469`](https://github.com/halfdomelabs/baseplate/commit/e12d4699363b6d8c24c060929bec7b117933c8c2), [`e12d469`](https://github.com/halfdomelabs/baseplate/commit/e12d4699363b6d8c24c060929bec7b117933c8c2), [`15f4f2c`](https://github.com/halfdomelabs/baseplate/commit/15f4f2c6742bdde2b6a5f0b5f5063e01a053123e)]:
  - @baseplate-dev/fastify-generators@0.6.15
  - @baseplate-dev/project-builder-lib@0.6.15
  - @baseplate-dev/core-generators@0.6.15
  - @baseplate-dev/plugin-queue@0.6.15
  - @baseplate-dev/react-generators@0.6.15
  - @baseplate-dev/sync@0.6.15
  - @baseplate-dev/utils@0.6.15
  - @baseplate-dev/ui-components@0.6.15

## 0.6.14

### Patch Changes

- Updated dependencies [[`e7ee500`](https://github.com/halfdomelabs/baseplate/commit/e7ee500e5a2d78778bd3bdb79b4f2f40b5f040ef), [`e7ee500`](https://github.com/halfdomelabs/baseplate/commit/e7ee500e5a2d78778bd3bdb79b4f2f40b5f040ef), [`e7ee500`](https://github.com/halfdomelabs/baseplate/commit/e7ee500e5a2d78778bd3bdb79b4f2f40b5f040ef)]:
  - @baseplate-dev/project-builder-lib@0.6.14
  - @baseplate-dev/fastify-generators@0.6.14
  - @baseplate-dev/plugin-queue@0.6.14
  - @baseplate-dev/core-generators@0.6.14
  - @baseplate-dev/react-generators@0.6.14
  - @baseplate-dev/sync@0.6.14
  - @baseplate-dev/ui-components@0.6.14
  - @baseplate-dev/utils@0.6.14

## 0.6.13

### Patch Changes

- [#950](https://github.com/halfdomelabs/baseplate/pull/950) [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3) Thanks [@kingston](https://github.com/kingston)! - Generated backends now build a single app runtime composition root (`createAppRuntime()`) that constructs every application-scoped service — Redis, email, queues, storage, Stripe, pubsub, notifications, and auth sessions — once and disposes them together on shutdown, replacing the previous module-level singletons. Code reaches them through `ctx.services`, feature modules declare themselves with `defineAppModule()`, and `ServiceContext` splits into `ExecutionContext` (auth state) and `ServiceContext` (adds `services`), with `ServiceContextWith<K>`/`RequestServiceContextWith<K>` for narrowing a dependency to the services it actually uses. `createAppRuntime()` accepts an `overrides` map for supplying test doubles and a `backgroundServices` flag (default `false`) controlling whether the process runs queue supervision and scheduling, and `withScriptContext()` builds and safely disposes a runtime for one-off scripts and seeds.

- [#931](https://github.com/halfdomelabs/baseplate/pull/931) [`ed5d784`](https://github.com/halfdomelabs/baseplate/commit/ed5d784a0edb2f794ae723ba3fb46a3768cade4c) Thanks [@kingston](https://github.com/kingston)! - The email plugin is now a feature-scoped module like storage: it requires an `emailFeatureRef` pointing at the feature the generated email module should live under, configurable from the plugin's settings form, and existing projects are migrated automatically by backfilling the reference against an `emails` feature. The Postmark, Resend, and stub adapters generate under that feature alongside the email service (e.g. `modules/emails/services/postmark.adapter.ts`) rather than at the app root. Outbound email is sent through a queued worker dispatched via the app runtime's queue service instead of synchronously inline, and call sites send through `ctx.services.email.send(...)` directly.

- [#950](https://github.com/halfdomelabs/baseplate/pull/950) [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3) Thanks [@kingston](https://github.com/kingston)! - Added a native notification plugin (`@baseplate-dev/plugin-notifications`). Notification types are declared through `AppModule.notificationTypes` and delivered in-app over GraphQL subscriptions, or by email when the email plugin is enabled and a type lists `email` in its `channels`, rendering a branded notification email through the transactional email library. A `notification-web` generator provides a notification bell and feed panel with avatars, unread badges, and an optional "View All" link, enabled per web app and mounted through a new extension point in the generated admin layout header — the slot renders empty when no plugin contributes to it, so existing generated apps are unaffected. The plugin surfaces a clear error when enabled on a backend app that has GraphQL subscriptions disabled.

- Updated dependencies [[`becf3c5`](https://github.com/halfdomelabs/baseplate/commit/becf3c52b87a775c3a988995385b174e42c0b9e4), [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3), [`80c1474`](https://github.com/halfdomelabs/baseplate/commit/80c1474f8903f0609f8d7484b0d0be8b59d4f6c0), [`45886a6`](https://github.com/halfdomelabs/baseplate/commit/45886a6fc3ac02f37bf19a3dae45d38186c9ad8a), [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3), [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3), [`03cc94e`](https://github.com/halfdomelabs/baseplate/commit/03cc94e0308d441404b4e84457e678b4d19c47b8), [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3), [`4819cfa`](https://github.com/halfdomelabs/baseplate/commit/4819cfad49158dec8eec05fc9d9b0025e7a81434), [`f596b4b`](https://github.com/halfdomelabs/baseplate/commit/f596b4b43bd9f0ecb7d5379739b0e36a01c40c70), [`307ed48`](https://github.com/halfdomelabs/baseplate/commit/307ed48144da1dab378c8b21e8cdbbe592fc3c48), [`cd8465e`](https://github.com/halfdomelabs/baseplate/commit/cd8465ec84b69241ee4e9a53d5131cd9bfe0b39f), [`ed5d784`](https://github.com/halfdomelabs/baseplate/commit/ed5d784a0edb2f794ae723ba3fb46a3768cade4c), [`80b7a20`](https://github.com/halfdomelabs/baseplate/commit/80b7a2090a06e5f729a798a7750ea126c8f27a8c), [`d0f8726`](https://github.com/halfdomelabs/baseplate/commit/d0f87265f16bfbde6c1525b0655850e906a7c3ed), [`47765e5`](https://github.com/halfdomelabs/baseplate/commit/47765e58ebd1979f94f0b1889efe539bcfe3e7f1), [`80c1474`](https://github.com/halfdomelabs/baseplate/commit/80c1474f8903f0609f8d7484b0d0be8b59d4f6c0), [`9548f2d`](https://github.com/halfdomelabs/baseplate/commit/9548f2d12af830e28187efed4b5a27d42020b289), [`e89c814`](https://github.com/halfdomelabs/baseplate/commit/e89c8143a7a4ea45817a45544fba6bf0ba6fe758), [`9030d45`](https://github.com/halfdomelabs/baseplate/commit/9030d45cd00ff8e3b9ea20744499457e25b0fbf4), [`0d3cd21`](https://github.com/halfdomelabs/baseplate/commit/0d3cd21bec022599977539f65fb2431d28574c83), [`13b78ca`](https://github.com/halfdomelabs/baseplate/commit/13b78caae04ad84441ca48d98a0b9e17135485d9)]:
  - @baseplate-dev/react-generators@0.6.13
  - @baseplate-dev/fastify-generators@0.6.13
  - @baseplate-dev/plugin-queue@0.6.13
  - @baseplate-dev/utils@0.6.13
  - @baseplate-dev/core-generators@0.6.13
  - @baseplate-dev/project-builder-lib@0.6.13
  - @baseplate-dev/ui-components@0.6.13
  - @baseplate-dev/sync@0.6.13

## 0.6.12

### Patch Changes

- [#911](https://github.com/halfdomelabs/baseplate/pull/911) [`3f925ff`](https://github.com/halfdomelabs/baseplate/commit/3f925ff4e22fde6c76f7c8b471fac044ed0a82b3) Thanks [@kingston](https://github.com/kingston)! - Upgrade the generated transactional email library to React Email 6.0.0

  The transactional library now uses the consolidated `react-email` package instead of the deprecated `@react-email/components`. See the [React Email 6.0 migration guide](https://react.email/docs/getting-started/updating-react-email) for details.

- Updated dependencies [[`0620a2b`](https://github.com/halfdomelabs/baseplate/commit/0620a2b2a59a4b401a9d9268f596776f4da09a9b), [`0620a2b`](https://github.com/halfdomelabs/baseplate/commit/0620a2b2a59a4b401a9d9268f596776f4da09a9b), [`0620a2b`](https://github.com/halfdomelabs/baseplate/commit/0620a2b2a59a4b401a9d9268f596776f4da09a9b), [`0620a2b`](https://github.com/halfdomelabs/baseplate/commit/0620a2b2a59a4b401a9d9268f596776f4da09a9b), [`0620a2b`](https://github.com/halfdomelabs/baseplate/commit/0620a2b2a59a4b401a9d9268f596776f4da09a9b), [`65a1b96`](https://github.com/halfdomelabs/baseplate/commit/65a1b969e7900b935800d111c23b3af70a660514)]:
  - @baseplate-dev/fastify-generators@0.6.12
  - @baseplate-dev/core-generators@0.6.12
  - @baseplate-dev/react-generators@0.6.12
  - @baseplate-dev/project-builder-lib@0.6.12
  - @baseplate-dev/plugin-queue@0.6.12
  - @baseplate-dev/sync@0.6.12
  - @baseplate-dev/ui-components@0.6.12
  - @baseplate-dev/utils@0.6.12

## 0.6.11

### Patch Changes

- Updated dependencies [[`cc296f4`](https://github.com/halfdomelabs/baseplate/commit/cc296f4737d0462f3536dda27ae9eb297f799b8b), [`05e7b98`](https://github.com/halfdomelabs/baseplate/commit/05e7b98c84069284976b33dfc3426a71a5b9bc64)]:
  - @baseplate-dev/core-generators@0.6.11
  - @baseplate-dev/project-builder-lib@0.6.11
  - @baseplate-dev/react-generators@0.6.11
  - @baseplate-dev/fastify-generators@0.6.11
  - @baseplate-dev/sync@0.6.11
  - @baseplate-dev/ui-components@0.6.11
  - @baseplate-dev/utils@0.6.11
  - @baseplate-dev/plugin-queue@0.6.11

## 0.6.10

### Patch Changes

- [#891](https://github.com/halfdomelabs/baseplate/pull/891) [`ffe0818`](https://github.com/halfdomelabs/baseplate/commit/ffe081872b7c99124243e3bb04e73c7b5ddd0f7e) Thanks [@kingston](https://github.com/kingston)! - - Add generated GraphQL files (`src/gql/*`) to `.gitignore` in generated projects
  - Replace Prisma's `postinstall` hook with a cacheable `prisma:generate` Turbo prebuild task
  - Make `lint`, `typecheck`, and `test` depend on prebuild tasks (`gql:generate`, `prisma:generate`) in Turbo so generated types are available in CI

  **Migration:** After syncing, remove previously tracked generated GraphQL files from git:

  ```sh
  git rm -r --cached apps/*/src/gql
  ```

- [#886](https://github.com/halfdomelabs/baseplate/pull/886) [`30765f0`](https://github.com/halfdomelabs/baseplate/commit/30765f079c46019d9c91fb96f1b3c399b4dc8759) Thanks [@kingston](https://github.com/kingston)! - Migrate from @originjs/vite-plugin-federation to @module-federation/vite for active maintenance and Vite 7+ peer-range support. As part of this, `@baseplate-dev/project-builder-lib` and `@baseplate-dev/ui-components` now declare `react`, `react-dom`, `zod` (and `@baseplate-dev/ui-components` from project-builder-lib) as peer dependencies — these were already required by consumers but are now explicit, so the federation runtime can dedupe them across host and remotes.

- Updated dependencies [[`f5ad6d2`](https://github.com/halfdomelabs/baseplate/commit/f5ad6d2ff994ecdd03f790b7e5c0915ddc7660c5), [`db93095`](https://github.com/halfdomelabs/baseplate/commit/db93095c6a9846d1e583832b70b85898ae785b10), [`ffe0818`](https://github.com/halfdomelabs/baseplate/commit/ffe081872b7c99124243e3bb04e73c7b5ddd0f7e), [`30765f0`](https://github.com/halfdomelabs/baseplate/commit/30765f079c46019d9c91fb96f1b3c399b4dc8759), [`4b38b79`](https://github.com/halfdomelabs/baseplate/commit/4b38b79282a32414c688b1f6212b88c0c75d413d), [`58d7c6b`](https://github.com/halfdomelabs/baseplate/commit/58d7c6bc433021e543e65817bf75582654ad4d42), [`4b38b79`](https://github.com/halfdomelabs/baseplate/commit/4b38b79282a32414c688b1f6212b88c0c75d413d), [`0afcb97`](https://github.com/halfdomelabs/baseplate/commit/0afcb979943a6f4f571c56af5e73936ed9d40370), [`62df439`](https://github.com/halfdomelabs/baseplate/commit/62df43917263034e621f29fb261d2b93ca9edf23), [`e8da347`](https://github.com/halfdomelabs/baseplate/commit/e8da347b3bd799b31c5d04d1317dedaa8c14e412), [`f9fe0c2`](https://github.com/halfdomelabs/baseplate/commit/f9fe0c20f16bf3495129aa859340dd689500cc1e), [`0c44597`](https://github.com/halfdomelabs/baseplate/commit/0c445971b18d50300c50c8bfb414967df9170c83), [`f5ad6d2`](https://github.com/halfdomelabs/baseplate/commit/f5ad6d2ff994ecdd03f790b7e5c0915ddc7660c5), [`f9fe0c2`](https://github.com/halfdomelabs/baseplate/commit/f9fe0c20f16bf3495129aa859340dd689500cc1e), [`f5ad6d2`](https://github.com/halfdomelabs/baseplate/commit/f5ad6d2ff994ecdd03f790b7e5c0915ddc7660c5), [`62df439`](https://github.com/halfdomelabs/baseplate/commit/62df43917263034e621f29fb261d2b93ca9edf23), [`c1e8765`](https://github.com/halfdomelabs/baseplate/commit/c1e8765fb3b59f56db4bc393e7469a54332c94b8)]:
  - @baseplate-dev/sync@0.6.10
  - @baseplate-dev/core-generators@0.6.10
  - @baseplate-dev/react-generators@0.6.10
  - @baseplate-dev/project-builder-lib@0.6.10
  - @baseplate-dev/fastify-generators@0.6.10
  - @baseplate-dev/ui-components@0.6.10
  - @baseplate-dev/plugin-queue@0.6.10
  - @baseplate-dev/utils@0.6.10

## 0.6.9

### Patch Changes

- Updated dependencies [[`7677630`](https://github.com/halfdomelabs/baseplate/commit/7677630f1e445e2c8c8c56b70435d12b0242affb)]:
  - @baseplate-dev/core-generators@0.6.9
  - @baseplate-dev/fastify-generators@0.6.9
  - @baseplate-dev/react-generators@0.6.9
  - @baseplate-dev/plugin-queue@0.6.9
  - @baseplate-dev/project-builder-lib@0.6.9
  - @baseplate-dev/sync@0.6.9
  - @baseplate-dev/ui-components@0.6.9
  - @baseplate-dev/utils@0.6.9

## 0.6.8

### Patch Changes

- Updated dependencies [[`04006df`](https://github.com/halfdomelabs/baseplate/commit/04006df7b2c9d124c83264d40aaeaa2a71558035), [`04006df`](https://github.com/halfdomelabs/baseplate/commit/04006df7b2c9d124c83264d40aaeaa2a71558035), [`f9cecc1`](https://github.com/halfdomelabs/baseplate/commit/f9cecc1c72d455aa5952c03c94182cb935b3b3dc), [`b231bca`](https://github.com/halfdomelabs/baseplate/commit/b231bcace5bd8395fe1cc92b2cb319302023342b)]:
  - @baseplate-dev/react-generators@0.6.8
  - @baseplate-dev/ui-components@0.6.8
  - @baseplate-dev/core-generators@0.6.8
  - @baseplate-dev/project-builder-lib@0.6.8
  - @baseplate-dev/plugin-queue@0.6.8
  - @baseplate-dev/fastify-generators@0.6.8
  - @baseplate-dev/sync@0.6.8
  - @baseplate-dev/utils@0.6.8

## 0.6.7

### Patch Changes

- Updated dependencies [[`2d39358`](https://github.com/halfdomelabs/baseplate/commit/2d39358510f73073a80ac78c3c7433a3aac2f0cd), [`335e063`](https://github.com/halfdomelabs/baseplate/commit/335e063b85676c9a55635ade6cf9b7b38bdd431d), [`c3a6719`](https://github.com/halfdomelabs/baseplate/commit/c3a67191d9a456d7440728f43f34cd02d28ffd12), [`2d39358`](https://github.com/halfdomelabs/baseplate/commit/2d39358510f73073a80ac78c3c7433a3aac2f0cd), [`2d39358`](https://github.com/halfdomelabs/baseplate/commit/2d39358510f73073a80ac78c3c7433a3aac2f0cd), [`7031c74`](https://github.com/halfdomelabs/baseplate/commit/7031c74af6a0ee74007a2b3cce30c738cff36e6a)]:
  - @baseplate-dev/core-generators@0.6.7
  - @baseplate-dev/ui-components@0.6.7
  - @baseplate-dev/fastify-generators@0.6.7
  - @baseplate-dev/react-generators@0.6.7
  - @baseplate-dev/plugin-queue@0.6.7
  - @baseplate-dev/project-builder-lib@0.6.7
  - @baseplate-dev/sync@0.6.7
  - @baseplate-dev/utils@0.6.7

## 0.6.6

### Patch Changes

- Updated dependencies [[`7cffc85`](https://github.com/halfdomelabs/baseplate/commit/7cffc85dfc2e9dc3ca6e1f243aeb874d2a1c5b13)]:
  - @baseplate-dev/fastify-generators@0.6.6
  - @baseplate-dev/plugin-queue@0.6.6
  - @baseplate-dev/core-generators@0.6.6
  - @baseplate-dev/project-builder-lib@0.6.6
  - @baseplate-dev/react-generators@0.6.6
  - @baseplate-dev/sync@0.6.6
  - @baseplate-dev/ui-components@0.6.6
  - @baseplate-dev/utils@0.6.6

## 0.6.5

### Patch Changes

- [#852](https://github.com/halfdomelabs/baseplate/pull/852) [`90ef6d5`](https://github.com/halfdomelabs/baseplate/commit/90ef6d51e0076834dd437d6854f90d391ccba3fb) Thanks [@kingston](https://github.com/kingston)! - Add Resend and Stub/Custom email providers alongside Postmark

- [#853](https://github.com/halfdomelabs/baseplate/pull/853) [`6c32220`](https://github.com/halfdomelabs/baseplate/commit/6c3222084aed198e3ab9ac2169443b3eb0e15359) Thanks [@kingston](https://github.com/kingston)! - Add definition issue checker and email definition editor suggestion to auto-create a transactional email library when the email plugin is enabled

- [#850](https://github.com/halfdomelabs/baseplate/pull/850) [`71146cd`](https://github.com/halfdomelabs/baseplate/commit/71146cd1ab784f45e4409fef7e6e447750047e48) Thanks [@kingston](https://github.com/kingston)! - Add descriptions to app and package type options in the create new dialog so users understand what each type does before choosing

- [#851](https://github.com/halfdomelabs/baseplate/pull/851) [`53b8635`](https://github.com/halfdomelabs/baseplate/commit/53b86354ee6bc4b46d1966f657e3d6c942cf1eb1) Thanks [@kingston](https://github.com/kingston)! - Add plugin dependency support: plugins can declare `pluginDependencies` in plugin.json to require other plugins. Includes circular dependency detection via toposort, definition issue checking that blocks save for unmet dependencies, UI gating that prompts users to enable/configure dependencies before enabling a plugin, and implementation plugin validation. Added dependency declarations to local-auth (email, queue, rate-limit), email (queue), and storage (queue).

- [#856](https://github.com/halfdomelabs/baseplate/pull/856) [`ed5d250`](https://github.com/halfdomelabs/baseplate/commit/ed5d250146f0b48386a8208741150f9011892a35) Thanks [@kingston](https://github.com/kingston)! - Restrict certain app and library types to one instance per project by adding a singleton flag to type configurations.

- Updated dependencies [[`37b6d8f`](https://github.com/halfdomelabs/baseplate/commit/37b6d8fd76086dab2953e12e48543334c5056f15), [`860b82d`](https://github.com/halfdomelabs/baseplate/commit/860b82da0466386ad11128c619595179ee76d0a4), [`9708637`](https://github.com/halfdomelabs/baseplate/commit/97086370718861d2c3170ec6d83af84793fbd09e), [`9708637`](https://github.com/halfdomelabs/baseplate/commit/97086370718861d2c3170ec6d83af84793fbd09e), [`8dcf7b3`](https://github.com/halfdomelabs/baseplate/commit/8dcf7b3c909672487bad61b7a4465d1860092363), [`06f5173`](https://github.com/halfdomelabs/baseplate/commit/06f517371c4904482873a4e30fe9b23b4fd2e36d), [`c24a24a`](https://github.com/halfdomelabs/baseplate/commit/c24a24ac9d2b66623acb0fda9c6ff2b3b80c0a6d), [`9688ca3`](https://github.com/halfdomelabs/baseplate/commit/9688ca348fd995a228bff597069f58644d7e9459), [`71146cd`](https://github.com/halfdomelabs/baseplate/commit/71146cd1ab784f45e4409fef7e6e447750047e48), [`fc8f158`](https://github.com/halfdomelabs/baseplate/commit/fc8f1582f1702d2d6f6eaa60607da7bb777750b5), [`5e182c3`](https://github.com/halfdomelabs/baseplate/commit/5e182c308c51b8d6f735b213ae12ba475c34dbd2), [`0ba6744`](https://github.com/halfdomelabs/baseplate/commit/0ba67445708689622341f3031502b3308f71f68e), [`53b8635`](https://github.com/halfdomelabs/baseplate/commit/53b86354ee6bc4b46d1966f657e3d6c942cf1eb1), [`85d957d`](https://github.com/halfdomelabs/baseplate/commit/85d957d4a2ab4b3a55a96c8dbba9a79d2f72511c), [`8d30c14`](https://github.com/halfdomelabs/baseplate/commit/8d30c145ce5d72dcfc038ff076ed0746d2d763cc), [`ed5d250`](https://github.com/halfdomelabs/baseplate/commit/ed5d250146f0b48386a8208741150f9011892a35), [`efcf233`](https://github.com/halfdomelabs/baseplate/commit/efcf2338c018ad46b08e8fef3994630dea511723), [`2a514a6`](https://github.com/halfdomelabs/baseplate/commit/2a514a63e741e1b16b3b1b168b84a60965141887), [`497904a`](https://github.com/halfdomelabs/baseplate/commit/497904a9b5088171f95c5e16bcda542fb5e98610), [`87a2218`](https://github.com/halfdomelabs/baseplate/commit/87a2218266f957bb4beacd6b13cb3d610fd15a41), [`c7131f5`](https://github.com/halfdomelabs/baseplate/commit/c7131f5caebda203ece99d30fcf2d58ead3abdb8), [`adc5f55`](https://github.com/halfdomelabs/baseplate/commit/adc5f55dbf3a1451f4402cd6bd126e15f60b8ed8), [`c7131f5`](https://github.com/halfdomelabs/baseplate/commit/c7131f5caebda203ece99d30fcf2d58ead3abdb8), [`c7131f5`](https://github.com/halfdomelabs/baseplate/commit/c7131f5caebda203ece99d30fcf2d58ead3abdb8)]:
  - @baseplate-dev/project-builder-lib@0.6.5
  - @baseplate-dev/fastify-generators@0.6.5
  - @baseplate-dev/utils@0.6.5
  - @baseplate-dev/react-generators@0.6.5
  - @baseplate-dev/ui-components@0.6.5
  - @baseplate-dev/core-generators@0.6.5
  - @baseplate-dev/plugin-queue@0.6.5
  - @baseplate-dev/sync@0.6.5

## 0.6.4

### Patch Changes

- Updated dependencies [[`ba315aa`](https://github.com/halfdomelabs/baseplate/commit/ba315aaaec0e8842ec7fadb765b1fed5e3abda5a), [`ba315aa`](https://github.com/halfdomelabs/baseplate/commit/ba315aaaec0e8842ec7fadb765b1fed5e3abda5a)]:
  - @baseplate-dev/ui-components@0.6.4
  - @baseplate-dev/project-builder-lib@0.6.4
  - @baseplate-dev/plugin-queue@0.6.4
  - @baseplate-dev/core-generators@0.6.4
  - @baseplate-dev/fastify-generators@0.6.4
  - @baseplate-dev/react-generators@0.6.4
  - @baseplate-dev/sync@0.6.4
  - @baseplate-dev/utils@0.6.4

## 0.6.3

### Patch Changes

- Updated dependencies [[`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931)]:
  - @baseplate-dev/react-generators@0.6.3
  - @baseplate-dev/ui-components@0.6.3
  - @baseplate-dev/fastify-generators@0.6.3
  - @baseplate-dev/project-builder-lib@0.6.3
  - @baseplate-dev/plugin-queue@0.6.3
  - @baseplate-dev/sync@0.6.3
  - @baseplate-dev/core-generators@0.6.3
  - @baseplate-dev/utils@0.6.3

## 0.6.2

### Patch Changes

- Reset version to 0.6.2 to fix accidental major version bumps caused by missing changeset fixed-group configuration.

## 1.0.1

### Patch Changes

- Updated dependencies [[`c371612`](https://github.com/halfdomelabs/baseplate/commit/c37161281c660a799a2a74537cd751fd58f3b05f), [`0b973f3`](https://github.com/halfdomelabs/baseplate/commit/0b973f3b9cb03fa1c49ceb49839b210466ecbbc7)]:
  - @baseplate-dev/fastify-generators@0.6.1
  - @baseplate-dev/plugin-queue@3.0.1
  - @baseplate-dev/core-generators@0.6.1
  - @baseplate-dev/project-builder-lib@0.6.1
  - @baseplate-dev/react-generators@0.6.1
  - @baseplate-dev/sync@0.6.1
  - @baseplate-dev/ui-components@0.6.1
  - @baseplate-dev/utils@0.6.1

## 1.0.0

### Patch Changes

- [#802](https://github.com/halfdomelabs/baseplate/pull/802) [`801c706`](https://github.com/halfdomelabs/baseplate/commit/801c7066f7e943c026f03e71b8d39242036e0cad) Thanks [@kingston](https://github.com/kingston)! - Update prettier to ignore unchanged files in output

- [#778](https://github.com/halfdomelabs/baseplate/pull/778) [`d6be7a9`](https://github.com/halfdomelabs/baseplate/commit/d6be7a97b5e6970be674bf9b49eddf1499b51f04) Thanks [@kingston](https://github.com/kingston)! - Upgrade packages to fix security vulnerabilities
  - @aws-sdk/client-s3, @aws-sdk/lib-storage, @aws-sdk/s3-presigned-post, @aws-sdk/s3-request-presigner: 3.990.0 → 3.995.0 (fixes fast-xml-parser CVE-2025-69873 critical, CVE DoS high)
  - postmark: 4.0.5 → 4.0.7 (fixes axios DoS vulnerability)
  - fastify-auth0-verify: 3.0.0 → 4.1.0 (updates @fastify/jwt to v10)

- Updated dependencies [[`ee7ee0e`](https://github.com/halfdomelabs/baseplate/commit/ee7ee0e552090612190eb4446a52c30f4eefce6a), [`bd1095e`](https://github.com/halfdomelabs/baseplate/commit/bd1095e52dc3cecdb40bf84a906490a7c92fec40), [`801c706`](https://github.com/halfdomelabs/baseplate/commit/801c7066f7e943c026f03e71b8d39242036e0cad), [`1225fda`](https://github.com/halfdomelabs/baseplate/commit/1225fdace3e8da20152e0e78c4decf0c063faa56), [`3029d42`](https://github.com/halfdomelabs/baseplate/commit/3029d42f5d5967721f2b0d5892ea07a80c5f3a1f), [`dfa9638`](https://github.com/halfdomelabs/baseplate/commit/dfa963825c4ba847f9d21f4f014c4dd1722403d6), [`d6be7a9`](https://github.com/halfdomelabs/baseplate/commit/d6be7a97b5e6970be674bf9b49eddf1499b51f04), [`3b3be2b`](https://github.com/halfdomelabs/baseplate/commit/3b3be2b8d45b08552dca3d4e2b5ce391a958341b), [`eadad84`](https://github.com/halfdomelabs/baseplate/commit/eadad8494128ded2cbc76dfbe3b97f93769ea41f), [`801c706`](https://github.com/halfdomelabs/baseplate/commit/801c7066f7e943c026f03e71b8d39242036e0cad), [`ee7ee0e`](https://github.com/halfdomelabs/baseplate/commit/ee7ee0e552090612190eb4446a52c30f4eefce6a), [`801c706`](https://github.com/halfdomelabs/baseplate/commit/801c7066f7e943c026f03e71b8d39242036e0cad), [`dc238be`](https://github.com/halfdomelabs/baseplate/commit/dc238be00158a528a60d9e6ef9cec32b2d8297be), [`bd25ff0`](https://github.com/halfdomelabs/baseplate/commit/bd25ff08e71faeb97b560e7b349dba1967155704), [`8258b27`](https://github.com/halfdomelabs/baseplate/commit/8258b278e9a25a6e4bd5039a134238d071a63ecd), [`6e2675d`](https://github.com/halfdomelabs/baseplate/commit/6e2675d2166ac9bf470486efdc6a0e48df9bcc6d), [`634f6c5`](https://github.com/halfdomelabs/baseplate/commit/634f6c5aaffab982a985be9f85062de9d1e8a99b), [`2f860c5`](https://github.com/halfdomelabs/baseplate/commit/2f860c513a1caf95fdfd0729cf548990166f9a6f), [`cad5352`](https://github.com/halfdomelabs/baseplate/commit/cad535239b47080e30f894383cc330e37213a76c), [`83c713b`](https://github.com/halfdomelabs/baseplate/commit/83c713b075eca2abc946e74bf3f03e515e601eba), [`78315cc`](https://github.com/halfdomelabs/baseplate/commit/78315ccd9b0b0330cd2d08584c6d5ec516d641e3), [`2104145`](https://github.com/halfdomelabs/baseplate/commit/210414588d8b1f6816c45054be3b7eea5763b5ce), [`bd25ff0`](https://github.com/halfdomelabs/baseplate/commit/bd25ff08e71faeb97b560e7b349dba1967155704), [`cad5352`](https://github.com/halfdomelabs/baseplate/commit/cad535239b47080e30f894383cc330e37213a76c)]:
  - @baseplate-dev/utils@0.6.0
  - @baseplate-dev/project-builder-lib@0.6.0
  - @baseplate-dev/fastify-generators@0.6.0
  - @baseplate-dev/react-generators@0.6.0
  - @baseplate-dev/core-generators@0.6.0
  - @baseplate-dev/ui-components@0.6.0
  - @baseplate-dev/plugin-queue@3.0.0
  - @baseplate-dev/sync@0.6.0

## 0.1.3

### Patch Changes

- [#769](https://github.com/halfdomelabs/baseplate/pull/769) [`cb2446e`](https://github.com/halfdomelabs/baseplate/commit/cb2446e235794bf5d45a1671ae320ccce12eb504) Thanks [@kingston](https://github.com/kingston)! - Fix hard-coded email template imports in auth plugin

- Updated dependencies [[`cb2446e`](https://github.com/halfdomelabs/baseplate/commit/cb2446e235794bf5d45a1671ae320ccce12eb504), [`6c190fe`](https://github.com/halfdomelabs/baseplate/commit/6c190fe50240f0ddc984af757b7900d053433bb1), [`254d675`](https://github.com/halfdomelabs/baseplate/commit/254d675079930e5b569bf1c0c4576f1459d23a03), [`9129381`](https://github.com/halfdomelabs/baseplate/commit/9129381e17504136837d07deb9958708791da43e)]:
  - @baseplate-dev/core-generators@0.5.3
  - @baseplate-dev/fastify-generators@0.5.3
  - @baseplate-dev/react-generators@0.5.3
  - @baseplate-dev/plugin-queue@2.0.3
  - @baseplate-dev/project-builder-lib@0.5.3
  - @baseplate-dev/sync@0.5.3
  - @baseplate-dev/ui-components@0.5.3
  - @baseplate-dev/utils@0.5.3

## 0.1.2

### Patch Changes

- [#759](https://github.com/halfdomelabs/baseplate/pull/759) [`7e58d6a`](https://github.com/halfdomelabs/baseplate/commit/7e58d6a5d6c62b1bb5822ccec2a172aeac6190a3) Thanks [@kingston](https://github.com/kingston)! - Add emailTemplateSpec for cross-plugin email template registration

  Introduces `emailTemplateSpec` in plugin-email, allowing other plugins to register email template generators with the transactional library compilation process. The auth plugin now uses this spec to register password-reset, password-changed, and account-verification email templates as proper generators instead of using snapshots. Also exports `emailTemplatesProvider` and adds component project exports to enable cross-generator template imports.

- [#759](https://github.com/halfdomelabs/baseplate/pull/759) [`7e58d6a`](https://github.com/halfdomelabs/baseplate/commit/7e58d6a5d6c62b1bb5822ccec2a172aeac6190a3) Thanks [@kingston](https://github.com/kingston)! - Add password reset flow
  - **Backend**: Password reset service with secure token generation (SHA-256 hashed, single-use, 1-hour expiry), rate limiting (per-IP, per-email, global), and session invalidation on reset
  - **Backend**: GraphQL mutations for requesting reset, validating tokens, and completing reset
  - **Backend**: `AUTH_FRONTEND_URL` config field for constructing reset email links
  - **Frontend**: Forgot password and reset password pages with proper error handling
  - **Frontend**: Shared auth constants file for password validation limits
  - **Email**: Password changed confirmation email template
  - **Email**: Added `sendEmail` as a project export from the email module

- [#755](https://github.com/halfdomelabs/baseplate/pull/755) [`02740a6`](https://github.com/halfdomelabs/baseplate/commit/02740a6e230c7fbf28fc768543353e847671c51b) Thanks [@kingston](https://github.com/kingston)! - Upgrade linting packages

  **Major version bumps:**
  - eslint: 9.32.0 → 9.39.2
  - @eslint/js: 9.32.0 → 9.39.2
  - eslint-plugin-perfectionist: 4.15.0 → 5.4.0
  - eslint-plugin-react-hooks: 5.2.0 → 7.0.1
  - eslint-plugin-unicorn: 60.0.0 → 62.0.0
  - globals: 16.4.0 → 17.3.0
  - prettier-plugin-packagejson: 2.5.19 → 3.0.0
  - storybook: 10.1.10 → 10.2.8

  **Minor/patch bumps:**
  - @vitest/eslint-plugin: 1.3.4 → 1.6.6 (tools), 1.6.5 → 1.6.6 (core-generators)
  - eslint-plugin-storybook: 10.1.10 → 10.2.3
  - prettier-plugin-tailwindcss: 0.6.14 → 0.7.2
  - typescript-eslint: 8.38.0 → 8.54.0
  - @types/eslint-plugin-jsx-a11y: 6.10.0 → 6.10.1

  **Config changes:**
  - Updated eslint-plugin-react-hooks v7 API: `configs['recommended-latest']` → `configs.flat['recommended-latest']`
  - Disabled new strict rules from react-hooks v7 (refs, set-state-in-effect, preserve-manual-memoization, incompatible-library)

- [#756](https://github.com/halfdomelabs/baseplate/pull/756) [`dd40bcd`](https://github.com/halfdomelabs/baseplate/commit/dd40bcd219c79f0cd7b66c0427c77deda0664072) Thanks [@kingston](https://github.com/kingston)! - Upgrade packages to fix security vulnerabilities and update to latest versions

  **Security fixes:**
  - @modelcontextprotocol/sdk: 1.25.1 → 1.26.0 (fixes CVE-2026-25536 - cross-client data leak)
  - fastify: 5.6.2 → 5.7.4 (security patches)
  - diff: 8.0.2 → 8.0.3 (fixes CVE-2026-24001 - DoS vulnerability)
  - testcontainers: 11.10.0 → 11.11.0 (fixes undici vulnerability)

  **Package updates (monorepo):**
  - @tailwindcss/vite: 4.1.13 → 4.1.18
  - tailwindcss: 4.1.13 → 4.1.18
  - @tanstack/react-router: 1.139.7 → 1.159.5
  - @tanstack/router-plugin: 1.139.7 → 1.159.5
  - @testing-library/jest-dom: 6.6.3 → 6.9.1
  - concurrently: 9.0.1 → 9.2.1
  - ts-morph: 26.0.0 → 27.0.2

  **Package updates (generated projects):**
  - prisma/@prisma/client/@prisma/adapter-pg: 7.2.0 → 7.4.0
  - postmark: 4.0.2 → 4.0.5
  - axios: 1.12.0 → 1.13.5

- Updated dependencies [[`ef1354d`](https://github.com/halfdomelabs/baseplate/commit/ef1354da11e2c48a80af03f44834555ce63a2948), [`b4db947`](https://github.com/halfdomelabs/baseplate/commit/b4db947f256c4b8639d7f18ffb58bb2b1646c497), [`683eb15`](https://github.com/halfdomelabs/baseplate/commit/683eb15c2c37259266959e0760b419e07f70a27e), [`938a7b1`](https://github.com/halfdomelabs/baseplate/commit/938a7b113550a7a245b65b5dfe3cc641f11096b7), [`02740a6`](https://github.com/halfdomelabs/baseplate/commit/02740a6e230c7fbf28fc768543353e847671c51b), [`dd40bcd`](https://github.com/halfdomelabs/baseplate/commit/dd40bcd219c79f0cd7b66c0427c77deda0664072), [`7d1a9d6`](https://github.com/halfdomelabs/baseplate/commit/7d1a9d6d381279434f2ac632e9f8accde34dda25), [`63bd074`](https://github.com/halfdomelabs/baseplate/commit/63bd074b3b24b0978d4271a5bc76a8531b0f60c2)]:
  - @baseplate-dev/fastify-generators@0.5.2
  - @baseplate-dev/project-builder-lib@0.5.2
  - @baseplate-dev/react-generators@0.5.2
  - @baseplate-dev/core-generators@0.5.2
  - @baseplate-dev/ui-components@0.5.2
  - @baseplate-dev/sync@0.5.2
  - @baseplate-dev/plugin-queue@2.0.2
  - @baseplate-dev/utils@0.5.2

## 0.1.1

### Patch Changes

- [#740](https://github.com/halfdomelabs/baseplate/pull/740) [`2de5d5c`](https://github.com/halfdomelabs/baseplate/commit/2de5d5c43c5354571d50707a99b4028ff8792534) Thanks [@kingston](https://github.com/kingston)! - Add email plugin with Postmark implementation for queue-based email delivery
  - Add `@baseplate-dev/plugin-email/transactional-lib` library type for generating transactional email libraries
  - Include reusable email components (Button, Heading, Text, Link, Divider, Section, Layout)

- Updated dependencies [[`2de5d5c`](https://github.com/halfdomelabs/baseplate/commit/2de5d5c43c5354571d50707a99b4028ff8792534), [`ecebd3b`](https://github.com/halfdomelabs/baseplate/commit/ecebd3bf50cfa2d2a62501e0be39c411b42bed25), [`ff4203e`](https://github.com/halfdomelabs/baseplate/commit/ff4203e45a057b25a0ded5ecb3e1c07f5c7108b4), [`1debcb8`](https://github.com/halfdomelabs/baseplate/commit/1debcb89807fafdd7415a659f4bebbad0d69f072), [`55aa484`](https://github.com/halfdomelabs/baseplate/commit/55aa484621f2dc5b1195b6b537e7d6ad215bc499), [`2de5d5c`](https://github.com/halfdomelabs/baseplate/commit/2de5d5c43c5354571d50707a99b4028ff8792534)]:
  - @baseplate-dev/fastify-generators@0.5.1
  - @baseplate-dev/react-generators@0.5.1
  - @baseplate-dev/project-builder-lib@0.5.1
  - @baseplate-dev/plugin-queue@2.0.1
  - @baseplate-dev/core-generators@0.5.1
  - @baseplate-dev/sync@0.5.1
  - @baseplate-dev/ui-components@0.5.1
