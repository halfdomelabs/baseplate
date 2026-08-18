# @baseplate-dev/plugin-notifications

## 0.6.19

### Patch Changes

- [#1030](https://github.com/halfdomelabs/baseplate/pull/1030) [`e5c3315`](https://github.com/halfdomelabs/baseplate/commit/e5c3315615780e85914cf9ce3a95d325572d0f84) Thanks [@kingston](https://github.com/kingston)! - Template extraction now resolves imports of a generated sibling package back to the import provider that owns them, and skips files the project has snapshotted as diverged, so apps sourcing their UI components from a shared library can have their templates extracted. The generated email service and notification email channel no longer carry `/* TPL_* */` marker comments.

- Updated dependencies [[`daef666`](https://github.com/halfdomelabs/baseplate/commit/daef666c5710453aa3a5777976e8ba4e70025135), [`616d2f5`](https://github.com/halfdomelabs/baseplate/commit/616d2f5cb41a91e01b1689309a56d5b2525037dc), [`94d84c1`](https://github.com/halfdomelabs/baseplate/commit/94d84c1ce807fe7fa55eb1f6f01515a6fea137f6), [`e5c3315`](https://github.com/halfdomelabs/baseplate/commit/e5c3315615780e85914cf9ce3a95d325572d0f84)]:
  - @baseplate-dev/core-generators@0.6.19
  - @baseplate-dev/fastify-generators@0.6.19
  - @baseplate-dev/plugin-ai@0.6.19
  - @baseplate-dev/project-builder-lib@0.6.19
  - @baseplate-dev/react-generators@0.6.19
  - @baseplate-dev/plugin-email@0.6.19
  - @baseplate-dev/sync@0.6.19
  - @baseplate-dev/plugin-queue@0.6.19
  - @baseplate-dev/ui-components@0.6.19
  - @baseplate-dev/utils@0.6.19

## 0.6.18

### Patch Changes

- [#1021](https://github.com/halfdomelabs/baseplate/pull/1021) [`32a2598`](https://github.com/halfdomelabs/baseplate/commit/32a2598a25a00499a7b073bc77d89e49af7a39ba) Thanks [@kingston](https://github.com/kingston)! - Plugins can now contribute their own `.agents/<id>.md` reference doc, linked from the generated `AGENTS.md`; the storage, Stripe, and notifications plugins each use this to document how to configure file categories, billing plans, and notification topics when relevant.

- [#1024](https://github.com/halfdomelabs/baseplate/pull/1024) [`ce52092`](https://github.com/halfdomelabs/baseplate/commit/ce5209240d4163966967f60cc9fa6286c4f8dcbb) Thanks [@kingston](https://github.com/kingston)! - The generated notifications email channel no longer hardcodes an import from an unrelated example project's transactional-email package; it now resolves the import from your project's own transactional library, matching how the rest of the file's email imports already worked.

- Updated dependencies [[`32a2598`](https://github.com/halfdomelabs/baseplate/commit/32a2598a25a00499a7b073bc77d89e49af7a39ba), [`eeff7b5`](https://github.com/halfdomelabs/baseplate/commit/eeff7b5895155dc252720d70ced0eca64272ad6a), [`ce52092`](https://github.com/halfdomelabs/baseplate/commit/ce5209240d4163966967f60cc9fa6286c4f8dcbb), [`e766854`](https://github.com/halfdomelabs/baseplate/commit/e766854f565d24003c7d4adc8011445953713917), [`6f6e083`](https://github.com/halfdomelabs/baseplate/commit/6f6e0834b3963046e91e509fc6638130f290428e), [`6f6e083`](https://github.com/halfdomelabs/baseplate/commit/6f6e0834b3963046e91e509fc6638130f290428e), [`6f6e083`](https://github.com/halfdomelabs/baseplate/commit/6f6e0834b3963046e91e509fc6638130f290428e), [`8285b67`](https://github.com/halfdomelabs/baseplate/commit/8285b67d1627e0b4200d716ebdce6accc7fd67a1), [`865e976`](https://github.com/halfdomelabs/baseplate/commit/865e97651f2306580f21532a939dc317d53bf4f8), [`a091468`](https://github.com/halfdomelabs/baseplate/commit/a091468889619613d028db530acd42f7ab476d58), [`ff22f21`](https://github.com/halfdomelabs/baseplate/commit/ff22f21b3d92705b904fdacb90819bb3bdd6c303), [`93aee4f`](https://github.com/halfdomelabs/baseplate/commit/93aee4f95c4cef9e16e08e1934ccae2d5d3f3ce6)]:
  - @baseplate-dev/plugin-ai@0.6.18
  - @baseplate-dev/utils@0.6.18
  - @baseplate-dev/sync@0.6.18
  - @baseplate-dev/core-generators@0.6.18
  - @baseplate-dev/fastify-generators@0.6.18
  - @baseplate-dev/react-generators@0.6.18
  - @baseplate-dev/plugin-email@0.6.18
  - @baseplate-dev/ui-components@0.6.18
  - @baseplate-dev/project-builder-lib@0.6.18
  - @baseplate-dev/plugin-queue@0.6.18

## 0.6.17

### Patch Changes

- [#1003](https://github.com/halfdomelabs/baseplate/pull/1003) [`bd82e72`](https://github.com/halfdomelabs/baseplate/commit/bd82e727543a5ed1582ff0c15a8a39914865d3ca) Thanks [@kingston](https://github.com/kingston)! - Queue definitions can now declare an `onFinalAttemptFailure` hook beside their retry config, which runs when a handler throws on the last attempt and lets the job complete instead of failing; jobs also expose `maxAttempts` alongside `attemptNumber`.

- [#1006](https://github.com/halfdomelabs/baseplate/pull/1006) [`5f81746`](https://github.com/halfdomelabs/baseplate/commit/5f8174614d58b456d0db5bd8ab67ae8a49c21a5a) Thanks [@kingston](https://github.com/kingston)! - Notification types are now declared with `defineNotificationType` or `defineBatchedNotificationType`, with topic-based per-channel preferences (off, immediate or digest), keyed collapse-and-retract so repeat activity updates one feed row in place, and per-channel email renderers. Generated apps gain a `notificationPreferences` query plus mutations to set and clear a preference, and a migration adds an index to the notification delivery table. **Breaking:** types now declare topics instead of a `category`, and renderers no longer receive an actor — whoever triggered a notification travels in `params`.

- [#992](https://github.com/halfdomelabs/baseplate/pull/992) [`dd758d3`](https://github.com/halfdomelabs/baseplate/commit/dd758d3a3639e476056a0829d28a58ef8a8f1ff4) Thanks [@kingston](https://github.com/kingston)! - The notification feed can now load further pages without discarding the ones already loaded, and the notification panel shows the unread count for the whole feed rather than just the rows on screen.

- Updated dependencies [[`b202a97`](https://github.com/halfdomelabs/baseplate/commit/b202a9772434de41a2abcc73c4c96e6f1ddab7c0), [`bd82e72`](https://github.com/halfdomelabs/baseplate/commit/bd82e727543a5ed1582ff0c15a8a39914865d3ca), [`ae275d0`](https://github.com/halfdomelabs/baseplate/commit/ae275d0d5d58c0b3d0cee41786938b8069d5e4bc), [`f5c5282`](https://github.com/halfdomelabs/baseplate/commit/f5c528261e829967951d19c6b2f9fa59ae686c21), [`f5c5282`](https://github.com/halfdomelabs/baseplate/commit/f5c528261e829967951d19c6b2f9fa59ae686c21), [`dd758d3`](https://github.com/halfdomelabs/baseplate/commit/dd758d3a3639e476056a0829d28a58ef8a8f1ff4), [`b202a97`](https://github.com/halfdomelabs/baseplate/commit/b202a9772434de41a2abcc73c4c96e6f1ddab7c0)]:
  - @baseplate-dev/core-generators@0.6.17
  - @baseplate-dev/react-generators@0.6.17
  - @baseplate-dev/fastify-generators@0.6.17
  - @baseplate-dev/plugin-queue@0.6.17
  - @baseplate-dev/project-builder-lib@0.6.17
  - @baseplate-dev/plugin-email@0.6.17
  - @baseplate-dev/sync@0.6.17
  - @baseplate-dev/ui-components@0.6.17
  - @baseplate-dev/utils@0.6.17

## 0.6.16

### Patch Changes

- [#994](https://github.com/halfdomelabs/baseplate/pull/994) [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552) Thanks [@kingston](https://github.com/kingston)! - Notification types now require a `category` and render a single event by default, opting into batched rendering explicitly via `aggregate` — so a single-event renderer can no longer be handed a batch and silently render only the first. Renderers also receive the actor, snapshotted onto the row at notify time so it survives a rename or deletion.

- [#994](https://github.com/halfdomelabs/baseplate/pull/994) [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552) Thanks [@kingston](https://github.com/kingston)! - The notification feed is now cursor-paginated via a `notificationFeed` connection, so rows are no longer skipped or repeated when a notification arrives between page fetches.

- [#994](https://github.com/halfdomelabs/baseplate/pull/994) [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552) Thanks [@kingston](https://github.com/kingston)! - Notifications and their dispatch requests are now deleted after a retention window instead of accumulating forever, so the feed, badge count, and mark-all-as-read no longer degrade as a project ages. Rows still owing a delivery are kept until it settles.

- [#994](https://github.com/halfdomelabs/baseplate/pull/994) [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552) Thanks [@kingston](https://github.com/kingston)! - Backend services are now split into a public `AppServices` tier reachable from request contexts and an `InternalServices` tier that only workers and scripts can reach, so a resolver naming an internal service is a compile error. The email transport and the notification outbox are now internal, so request-scoped code can no longer reach them to bypass their queues.

- [#994](https://github.com/halfdomelabs/baseplate/pull/994) [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552) Thanks [@kingston](https://github.com/kingston)! - Notifications are now delivered durably — deliveries survive a crash, retry with backoff, and go to many recipients at once via `notifyMany` — with emails rendered at send time so copy fixes reach mail that has not gone out, and clearing one from the feed no longer cancels its email. **Breaking:** the queue plugin is now required, `notify`/`notifyText` return `{ requestId }` instead of the created row, and custom channels receive the recipient and actor details from the service rather than querying for them.

- Updated dependencies [[`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552), [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552), [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552), [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552), [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552), [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552), [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552), [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552), [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552), [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552)]:
  - @baseplate-dev/react-generators@0.6.16
  - @baseplate-dev/core-generators@0.6.16
  - @baseplate-dev/fastify-generators@0.6.16
  - @baseplate-dev/plugin-email@0.6.16
  - @baseplate-dev/plugin-queue@0.6.16
  - @baseplate-dev/ui-components@0.6.16
  - @baseplate-dev/project-builder-lib@0.6.16
  - @baseplate-dev/sync@0.6.16
  - @baseplate-dev/utils@0.6.16

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
