# @baseplate-dev/fastify-generators

## 1.0.8

### Patch Changes

- [#977](https://github.com/halfdomelabs/baseplate/pull/977) [`425d568`](https://github.com/halfdomelabs/baseplate/commit/425d568b1c98487b283fea7a65c429babc993da6) Thanks [@kingston](https://github.com/kingston)! - Generated GraphQL `where` filters now permit the full configured nesting depth of `AND`/`OR`/`NOT` clauses instead of rejecting queries one level early, and model authorizers and query helpers now typecheck in projects with many models.

- [#985](https://github.com/halfdomelabs/baseplate/pull/985) [`2ec1006`](https://github.com/halfdomelabs/baseplate/commit/2ec1006a5327ec48b5b1319e85d87f0885dddc95) Thanks [@kingston](https://github.com/kingston)! - Backend environment configuration is now exposed via a lazy `getConfig()` (plus an `isDevelopment()` helper) instead of a module-scope `config` constant, so backend modules can be imported by tooling and tests without a fully configured environment, and invalid configuration now fails with a readable list of the offending variables.

- [#991](https://github.com/halfdomelabs/baseplate/pull/991) [`3785e88`](https://github.com/halfdomelabs/baseplate/commit/3785e88c3cdc2ae3160a1b266f5f5695d1292a13) Thanks [@kingston](https://github.com/kingston)! - Backend services are now split into a public `AppServices` tier reachable from request contexts and an `InternalServices` tier that only workers and scripts can reach, so a resolver naming an internal service is a compile error. The email transport and the notification outbox are now internal, so request-scoped code can no longer reach them to bypass their queues.

- [#984](https://github.com/halfdomelabs/baseplate/pull/984) [`eb22c19`](https://github.com/halfdomelabs/baseplate/commit/eb22c1994fa9e369b5b7b79b6394550889dd99b8) Thanks [@kingston](https://github.com/kingston)! - Generated backends no longer install the unused `pg-connection-string` dependency, and the unused `destroyTestDatabase` test helper has been removed.

- [#988](https://github.com/halfdomelabs/baseplate/pull/988) [`380a4e2`](https://github.com/halfdomelabs/baseplate/commit/380a4e25f097f867e679b30993b5cb62ca8e8c79) Thanks [@kingston](https://github.com/kingston)! - Generated projects now pin pnpm 11.18.0 and use current versions of their runtime dependencies, including major upgrades to bullmq, Stripe, pino, mime-types, react-dropzone and react-day-picker, so a synced project needs a fresh install and may need changes where it calls those libraries directly. File uploads also accept legacy JPEG extensions such as `.jfif` that were previously rejected, and an unrecognized Stripe subscription status now fails the webhook instead of writing a bad value.

- Updated dependencies [[`4c9acc4`](https://github.com/halfdomelabs/baseplate/commit/4c9acc48cc5b62aa3a642aef2ef3ed6d22fd2017), [`3e3cf59`](https://github.com/halfdomelabs/baseplate/commit/3e3cf5967aadb12d473e509a5f225bbdaa79dc0e), [`380a4e2`](https://github.com/halfdomelabs/baseplate/commit/380a4e25f097f867e679b30993b5cb62ca8e8c79)]:
  - @baseplate-dev/core-generators@1.0.0
  - @baseplate-dev/sync@1.0.0
  - @baseplate-dev/utils@1.0.0

## 0.6.15

### Patch Changes

- [#956](https://github.com/halfdomelabs/baseplate/pull/956) [`403874a`](https://github.com/halfdomelabs/baseplate/commit/403874a10f67120eb36badc93920359cb267dcb5) Thanks [@kingston](https://github.com/kingston)! - GraphQL list relation fields can now opt into orderBy arguments using the related model's sortable fields, and requesting ordering on a model with no sortable fields now fails with a clear error instead of generating an invalid schema.

- [#962](https://github.com/halfdomelabs/baseplate/pull/962) [`615c8e1`](https://github.com/halfdomelabs/baseplate/commit/615c8e173cede3cfa0298b92d5b84999ffedce5b) Thanks [@kingston](https://github.com/kingston)! - Tightened handling of indexed access across the codebase, fixing latent cases where a missing array element or record entry could surface as an undefined value in a field typed as required, such as unmatched regular expression capture groups and parsed command strings.

- [#967](https://github.com/halfdomelabs/baseplate/pull/967) [`8b2dfd7`](https://github.com/halfdomelabs/baseplate/commit/8b2dfd7aa799b51dfa02deeaf7592af8ea29ed7e) Thanks [@kingston](https://github.com/kingston)! - Fix login and change-password failing with an internal server error instead of an invalid credentials message when the account has no stored password, which affected logging in with an unrecognized email address and changing the password on accounts linked only to a social provider

- [#961](https://github.com/halfdomelabs/baseplate/pull/961) [`05cfe52`](https://github.com/halfdomelabs/baseplate/commit/05cfe5202692c8f3f3876d2e1c994c267d18d622) Thanks [@kingston](https://github.com/kingston)! - Model policy actions now always return a where clause from `.where()`, using an empty clause for unrestricted grants instead of `undefined`, so an authorization filter can no longer be spread into a query as "no filter" and silently widen it. Denied grants continue to throw.

- [#962](https://github.com/halfdomelabs/baseplate/pull/962) [`615c8e1`](https://github.com/halfdomelabs/baseplate/commit/615c8e173cede3cfa0298b92d5b84999ffedce5b) Thanks [@kingston](https://github.com/kingston)! - Generated projects now enable the `noUncheckedIndexedAccess` TypeScript compiler option, so indexed access such as `array[0]` or `record[key]` is typed as possibly undefined and must be handled explicitly. Existing projects will see new type errors on their next sync and should add the appropriate guards, defaults, or narrowing.

- [#959](https://github.com/halfdomelabs/baseplate/pull/959) [`9cdfaa9`](https://github.com/halfdomelabs/baseplate/commit/9cdfaa9e3702c8a569c5dac739877dc8330a8f73) Thanks [@kingston](https://github.com/kingston)! - Sortable and filterable field selections have moved out of the list query settings into a new model-level Sorting & Filtering section, since list queries and list relations sort by the same fields, and models can now define a default sort that orders results whenever a caller supplies no orderBy — including on relations and queries that expose no orderBy argument at all. Existing projects migrate automatically.

- [#963](https://github.com/halfdomelabs/baseplate/pull/963) [`9139686`](https://github.com/halfdomelabs/baseplate/commit/91396867ec7832068aa6a5d19d038dcd1f04ec5c) Thanks [@kingston](https://github.com/kingston)! - Support configuring a default and maximum page size for paginated GraphQL endpoints so large objects can't be fetched en masse, applied to list queries, connection queries, and paginated list relations alike; setting only a maximum also applies it as the default, since a cap alone would be bypassed by omitting the argument. Cursor pagination can now be enabled independently of offset pagination — a model can expose a list query, a connection query, or both, with where filtering and ordering available to either.

- [#971](https://github.com/halfdomelabs/baseplate/pull/971) [`e12d469`](https://github.com/halfdomelabs/baseplate/commit/e12d4699363b6d8c24c060929bec7b117933c8c2) Thanks [@kingston](https://github.com/kingston)! - Upgrade Prisma to 7.9.1 in generated projects (`prisma`, `@prisma/client`, and `@prisma/adapter-pg` from 7.9.0 → 7.9.1) to resolve a high-severity `find-my-way` advisory reached transitively through the Prisma CLI.

- [#972](https://github.com/halfdomelabs/baseplate/pull/972) [`15f4f2c`](https://github.com/halfdomelabs/baseplate/commit/15f4f2c6742bdde2b6a5f0b5f5063e01a053123e) Thanks [@kingston](https://github.com/kingston)! - Generated apps now use `@types/node` 24, matching the Node 24 runtime they already declare.

- Updated dependencies [[`615c8e1`](https://github.com/halfdomelabs/baseplate/commit/615c8e173cede3cfa0298b92d5b84999ffedce5b), [`615c8e1`](https://github.com/halfdomelabs/baseplate/commit/615c8e173cede3cfa0298b92d5b84999ffedce5b), [`e12d469`](https://github.com/halfdomelabs/baseplate/commit/e12d4699363b6d8c24c060929bec7b117933c8c2)]:
  - @baseplate-dev/core-generators@0.6.15
  - @baseplate-dev/sync@0.6.15
  - @baseplate-dev/utils@0.6.15

## 0.6.14

### Patch Changes

- [#953](https://github.com/halfdomelabs/baseplate/pull/953) [`e7ee500`](https://github.com/halfdomelabs/baseplate/commit/e7ee500e5a2d78778bd3bdb79b4f2f40b5f040ef) Thanks [@kingston](https://github.com/kingston)! - Add `r.viaMany` to model authorizers for delegating a role across a to-many relation — a row holds the role if some related row grants it, emitted as `{ relation: { some: … } }` and checked with a single query. The relation is constrained at the type level to relations that actually point at the target policy's model, so a mismatched pairing is a compile error rather than a filter against the wrong model.

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.6.14
  - @baseplate-dev/sync@0.6.14
  - @baseplate-dev/utils@0.6.14

## 0.6.13

### Patch Changes

- [#950](https://github.com/halfdomelabs/baseplate/pull/950) [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3) Thanks [@kingston](https://github.com/kingston)! - Generated backends now build a single app runtime composition root (`createAppRuntime()`) that constructs every application-scoped service — Redis, email, queues, storage, Stripe, pubsub, notifications, and auth sessions — once and disposes them together on shutdown, replacing the previous module-level singletons. Code reaches them through `ctx.services`, feature modules declare themselves with `defineAppModule()`, and `ServiceContext` splits into `ExecutionContext` (auth state) and `ServiceContext` (adds `services`), with `ServiceContextWith<K>`/`RequestServiceContextWith<K>` for narrowing a dependency to the services it actually uses. `createAppRuntime()` accepts an `overrides` map for supplying test doubles and a `backgroundServices` flag (default `false`) controlling whether the process runs queue supervision and scheduling, and `withScriptContext()` builds and safely disposes a runtime for one-off scripts and seeds.

- [#950](https://github.com/halfdomelabs/baseplate/pull/950) [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3) Thanks [@kingston](https://github.com/kingston)! - Added opt-in pagination, sorting, and filtering to generated GraphQL queries, configurable per model in the GraphQL section of the model editor. Enabling "Connection" generates a Relay-style `<model>sConnection(first, after, last, before)` query backed by Pothos's `t.prismaConnection`; `orderBy` adds multi-field sorting over the fields you mark sortable, with the model's ID field(s) appended as a stable cursor tiebreaker; `where` adds filtering over the fields you mark filterable, composing with row-level authorization and capped in depth and breadth; and to-many relation fields gain optional `skip`/`take` args (e.g. `user.todoLists(skip, take)`).

- [#950](https://github.com/halfdomelabs/baseplate/pull/950) [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3) Thanks [@kingston](https://github.com/kingston)! - Added a native notification plugin (`@baseplate-dev/plugin-notifications`). Notification types are declared through `AppModule.notificationTypes` and delivered in-app over GraphQL subscriptions, or by email when the email plugin is enabled and a type lists `email` in its `channels`, rendering a branded notification email through the transactional email library. A `notification-web` generator provides a notification bell and feed panel with avatars, unread badges, and an optional "View All" link, enabled per web app and mounted through a new extension point in the generated admin layout header — the slot renders empty when no plugin contributes to it, so existing generated apps are unaffected. The plugin surfaces a clear error when enabled on a backend app that has GraphQL subscriptions disabled.

- [#945](https://github.com/halfdomelabs/baseplate/pull/945) [`4819cfa`](https://github.com/halfdomelabs/baseplate/commit/4819cfad49158dec8eec05fc9d9b0025e7a81434) Thanks [@kingston](https://github.com/kingston)! - Generated backend test suites now run in parallel across Vitest workers instead of being pinned to a single worker: each worker migrates a shared template database once then clones its own per-worker database from it, and Redis keys are namespaced per worker, so concurrent test files no longer clobber each other's data. The generated `vitest.config.ts` takes an optional `maxWorkers` value, which DB-backed runs cap at 8 to avoid exhausting Postgres connections or clone locks on high-core CI runners, while unit-only runs (`TEST_MODE=unit`) stay uncapped.

- [#924](https://github.com/halfdomelabs/baseplate/pull/924) [`d0f8726`](https://github.com/halfdomelabs/baseplate/commit/d0f87265f16bfbde6c1525b0655850e906a7c3ed) Thanks [@kingston](https://github.com/kingston)! - Consolidated model authorization into a single generated policy per model. Each model emits one `createModelPolicy` file that declares its roles once and derives both the boolean instance check and the Prisma `where` filter from the same declaration, with action helpers grouped under `policy.actions`; reads filter through the policy, and authorized updates and deletes compose the grant into the query as one atomic operation, hiding an unauthorized row as a 404. Role predicates support scalar matches, relation filters, cached delegation to a parent model's policy via `r.via`, global-role and authenticated checks, and `and`/`or` combinations, and both policies and `r.via` delegation work with composite primary keys and multi-column foreign keys. The `r.userMatch`/`r.userWhere` verbs key a predicate on the authenticated user's id and only run for an authenticated principal, so an anonymous caller is denied without a per-role null guard.

- [#943](https://github.com/halfdomelabs/baseplate/pull/943) [`80c1474`](https://github.com/halfdomelabs/baseplate/commit/80c1474f8903f0609f8d7484b0d0be8b59d4f6c0) Thanks [@kingston](https://github.com/kingston)! - Upgrade concurrently to 10.0.4 in generated backend projects

- [#920](https://github.com/halfdomelabs/baseplate/pull/920) [`e89c814`](https://github.com/halfdomelabs/baseplate/commit/e89c8143a7a4ea45817a45544fba6bf0ba6fe758) Thanks [@kingston](https://github.com/kingston)! - Upgrade Prisma to 7.9.0 in generated projects (`prisma`, `@prisma/client`, and `@prisma/adapter-pg` from 7.8.0 → 7.9.0), and update the bundled Prisma schema formatter to match.

- [#928](https://github.com/halfdomelabs/baseplate/pull/928) [`9030d45`](https://github.com/halfdomelabs/baseplate/commit/9030d45cd00ff8e3b9ea20744499457e25b0fbf4) Thanks [@kingston](https://github.com/kingston)! - Upgrade tsx to 4.23.1 in generated backend projects (from 4.22.3) for performance improvements.

- [#927](https://github.com/halfdomelabs/baseplate/pull/927) [`0d3cd21`](https://github.com/halfdomelabs/baseplate/commit/0d3cd21bec022599977539f65fb2431d28574c83) Thanks [@kingston](https://github.com/kingston)! - Upgraded generated projects to TypeScript 6.0.3 (from 5.9.3), with typescript-eslint 8.65.0, `@vitest/eslint-plugin` 1.6.23, `eslint-plugin-perfectionist` 5.10.0, and `vitest-mock-extended` 3.1.1 for compatibility. Generated React apps now set `"types": ["node"]` in `tsconfig.app.json` and generated backends set `rootDir`/`types` in their `tsconfig.json`, since TypeScript 6 no longer implicitly includes `@types/node` globals for composite builds. Note that `@module-federation/vite` is pinned at exactly 1.17.0 — 1.17.1+ breaks the module federation shared-scope singleton for `zod`/`@baseplate-dev/project-builder-lib`, which left entity IDs unassigned when plugin-seeded models were merged into a new project during setup.

- Updated dependencies [[`80c1474`](https://github.com/halfdomelabs/baseplate/commit/80c1474f8903f0609f8d7484b0d0be8b59d4f6c0), [`45886a6`](https://github.com/halfdomelabs/baseplate/commit/45886a6fc3ac02f37bf19a3dae45d38186c9ad8a), [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3), [`4819cfa`](https://github.com/halfdomelabs/baseplate/commit/4819cfad49158dec8eec05fc9d9b0025e7a81434), [`9548f2d`](https://github.com/halfdomelabs/baseplate/commit/9548f2d12af830e28187efed4b5a27d42020b289), [`0d3cd21`](https://github.com/halfdomelabs/baseplate/commit/0d3cd21bec022599977539f65fb2431d28574c83)]:
  - @baseplate-dev/utils@0.6.13
  - @baseplate-dev/core-generators@0.6.13
  - @baseplate-dev/sync@0.6.13

## 0.6.12

### Patch Changes

- [#912](https://github.com/halfdomelabs/baseplate/pull/912) [`0620a2b`](https://github.com/halfdomelabs/baseplate/commit/0620a2b2a59a4b401a9d9268f596776f4da09a9b) Thanks [@kingston](https://github.com/kingston)! - Fix create-project being blocked by pnpm 11 approve-builds by removing @prisma/engines from generator dependencies and setting strictDepBuilds/allowBuilds in generated pnpm-workspace.yaml.

- [#912](https://github.com/halfdomelabs/baseplate/pull/912) [`0620a2b`](https://github.com/halfdomelabs/baseplate/commit/0620a2b2a59a4b401a9d9268f596776f4da09a9b) Thanks [@kingston](https://github.com/kingston)! - Upgrade Sentry packages to 10.63.0 to fix a memory leak.

- [#912](https://github.com/halfdomelabs/baseplate/pull/912) [`0620a2b`](https://github.com/halfdomelabs/baseplate/commit/0620a2b2a59a4b401a9d9268f596776f4da09a9b) Thanks [@kingston](https://github.com/kingston)! - Make RequestServiceContext available on the Fastify request object as `req.serviceContext`

- Updated dependencies [[`0620a2b`](https://github.com/halfdomelabs/baseplate/commit/0620a2b2a59a4b401a9d9268f596776f4da09a9b), [`65a1b96`](https://github.com/halfdomelabs/baseplate/commit/65a1b969e7900b935800d111c23b3af70a660514)]:
  - @baseplate-dev/core-generators@0.6.12
  - @baseplate-dev/sync@0.6.12
  - @baseplate-dev/utils@0.6.12

## 0.6.11

### Patch Changes

- Updated dependencies [[`cc296f4`](https://github.com/halfdomelabs/baseplate/commit/cc296f4737d0462f3536dda27ae9eb297f799b8b), [`05e7b98`](https://github.com/halfdomelabs/baseplate/commit/05e7b98c84069284976b33dfc3426a71a5b9bc64)]:
  - @baseplate-dev/core-generators@0.6.11
  - @baseplate-dev/sync@0.6.11
  - @baseplate-dev/utils@0.6.11

## 0.6.10

### Patch Changes

- [#891](https://github.com/halfdomelabs/baseplate/pull/891) [`ffe0818`](https://github.com/halfdomelabs/baseplate/commit/ffe081872b7c99124243e3bb04e73c7b5ddd0f7e) Thanks [@kingston](https://github.com/kingston)! - - Add generated GraphQL files (`src/gql/*`) to `.gitignore` in generated projects
  - Replace Prisma's `postinstall` hook with a cacheable `prisma:generate` Turbo prebuild task
  - Make `lint`, `typecheck`, and `test` depend on prebuild tasks (`gql:generate`, `prisma:generate`) in Turbo so generated types are available in CI

  **Migration:** After syncing, remove previously tracked generated GraphQL files from git:

  ```sh
  git rm -r --cached apps/*/src/gql
  ```

- [#895](https://github.com/halfdomelabs/baseplate/pull/895) [`58d7c6b`](https://github.com/halfdomelabs/baseplate/commit/58d7c6bc433021e543e65817bf75582654ad4d42) Thanks [@kingston](https://github.com/kingston)! - Improve Prisma schema merge by normalizing whitespace before diff3 to reduce false conflicts caused by Prisma's column-aligning formatter.

- [#898](https://github.com/halfdomelabs/baseplate/pull/898) [`0afcb97`](https://github.com/halfdomelabs/baseplate/commit/0afcb979943a6f4f571c56af5e73936ed9d40370) Thanks [@kingston](https://github.com/kingston)! - Re-introduce GraphQL subscriptions support, now transported over Server-Sent
  Events (SSE) instead of WebSockets (ENG-1088).

- [#888](https://github.com/halfdomelabs/baseplate/pull/888) [`f9fe0c2`](https://github.com/halfdomelabs/baseplate/commit/f9fe0c20f16bf3495129aa859340dd689500cc1e) Thanks [@kingston](https://github.com/kingston)! - Upgrade prisma to 7.8.0
  - prisma: 7.6.0 → 7.8.0
  - @prisma/client: 7.6.0 → 7.8.0
  - @prisma/adapter-pg: 7.6.0 → 7.8.0

- [#896](https://github.com/halfdomelabs/baseplate/pull/896) [`f5ad6d2`](https://github.com/halfdomelabs/baseplate/commit/f5ad6d2ff994ecdd03f790b7e5c0915ddc7660c5) Thanks [@kingston](https://github.com/kingston)! - Upgrade tsx to 4.22.3
  - tsx: 4.20.6 → 4.22.3

- Updated dependencies [[`f5ad6d2`](https://github.com/halfdomelabs/baseplate/commit/f5ad6d2ff994ecdd03f790b7e5c0915ddc7660c5), [`db93095`](https://github.com/halfdomelabs/baseplate/commit/db93095c6a9846d1e583832b70b85898ae785b10), [`62df439`](https://github.com/halfdomelabs/baseplate/commit/62df43917263034e621f29fb261d2b93ca9edf23), [`f9fe0c2`](https://github.com/halfdomelabs/baseplate/commit/f9fe0c20f16bf3495129aa859340dd689500cc1e), [`f5ad6d2`](https://github.com/halfdomelabs/baseplate/commit/f5ad6d2ff994ecdd03f790b7e5c0915ddc7660c5), [`62df439`](https://github.com/halfdomelabs/baseplate/commit/62df43917263034e621f29fb261d2b93ca9edf23), [`c1e8765`](https://github.com/halfdomelabs/baseplate/commit/c1e8765fb3b59f56db4bc393e7469a54332c94b8)]:
  - @baseplate-dev/sync@0.6.10
  - @baseplate-dev/core-generators@0.6.10
  - @baseplate-dev/utils@0.6.10

## 0.6.9

### Patch Changes

- [#884](https://github.com/halfdomelabs/baseplate/pull/884) [`7677630`](https://github.com/halfdomelabs/baseplate/commit/7677630f1e445e2c8c8c56b70435d12b0242affb) Thanks [@kingston](https://github.com/kingston)! - Upgrade fastify to 5.8.5, @fastify/static to 9.1.3, and axios to 1.15.2

- Updated dependencies [[`7677630`](https://github.com/halfdomelabs/baseplate/commit/7677630f1e445e2c8c8c56b70435d12b0242affb)]:
  - @baseplate-dev/core-generators@0.6.9
  - @baseplate-dev/sync@0.6.9
  - @baseplate-dev/utils@0.6.9

## 0.6.8

### Patch Changes

- Updated dependencies [[`b231bca`](https://github.com/halfdomelabs/baseplate/commit/b231bcace5bd8395fe1cc92b2cb319302023342b)]:
  - @baseplate-dev/core-generators@0.6.8
  - @baseplate-dev/sync@0.6.8
  - @baseplate-dev/utils@0.6.8

## 0.6.7

### Patch Changes

- [#872](https://github.com/halfdomelabs/baseplate/pull/872) [`2d39358`](https://github.com/halfdomelabs/baseplate/commit/2d39358510f73073a80ac78c3c7433a3aac2f0cd) Thanks [@kingston](https://github.com/kingston)! - Upgrade fastify to 5.8.4
  - fastify: 5.8.1 → 5.8.4

- [#872](https://github.com/halfdomelabs/baseplate/pull/872) [`2d39358`](https://github.com/halfdomelabs/baseplate/commit/2d39358510f73073a80ac78c3c7433a3aac2f0cd) Thanks [@kingston](https://github.com/kingston)! - Upgrade Prisma packages to 7.6.0
  - prisma: 7.5.0 → 7.6.0
  - @prisma/client: 7.5.0 → 7.6.0
  - @prisma/adapter-pg: 7.5.0 → 7.6.0
  - @prisma/internals: 7.5.0 → 7.6.0
  - @pothos/plugin-prisma: 4.14.1 → 4.14.2

- Updated dependencies [[`2d39358`](https://github.com/halfdomelabs/baseplate/commit/2d39358510f73073a80ac78c3c7433a3aac2f0cd), [`c3a6719`](https://github.com/halfdomelabs/baseplate/commit/c3a67191d9a456d7440728f43f34cd02d28ffd12), [`7031c74`](https://github.com/halfdomelabs/baseplate/commit/7031c74af6a0ee74007a2b3cce30c738cff36e6a)]:
  - @baseplate-dev/core-generators@0.6.7
  - @baseplate-dev/sync@0.6.7
  - @baseplate-dev/utils@0.6.7

## 0.6.6

### Patch Changes

- [#870](https://github.com/halfdomelabs/baseplate/pull/870) [`7cffc85`](https://github.com/halfdomelabs/baseplate/commit/7cffc85dfc2e9dc3ca6e1f243aeb874d2a1c5b13) Thanks [@kingston](https://github.com/kingston)! - Fix create/update input schemas to only include their respective fields using Zod `.pick()`, make fieldSchemas a `z.object()`, skip transform path when the operation has no transform fields, and omit unused `context` parameter in scalar-only methods without auth

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.6.6
  - @baseplate-dev/sync@0.6.6
  - @baseplate-dev/utils@0.6.6

## 0.6.5

### Patch Changes

- [#854](https://github.com/halfdomelabs/baseplate/pull/854) [`9708637`](https://github.com/halfdomelabs/baseplate/commit/97086370718861d2c3170ec6d83af84793fbd09e) Thanks [@kingston](https://github.com/kingston)! - Add optional description field to enum values that flows through to Pothos GraphQL enum type definitions

- [#844](https://github.com/halfdomelabs/baseplate/pull/844) [`06f5173`](https://github.com/halfdomelabs/baseplate/commit/06f517371c4904482873a4e30fe9b23b4fd2e36d) Thanks [@kingston](https://github.com/kingston)! - Improve better-auth feature parity with local-auth by adding password/email flows, admin mutations, frontend auth pages, seed user generator, and admin role. Also updates role flags, refines admin role handling, enhances auth UI, and adds project migration.

- [#845](https://github.com/halfdomelabs/baseplate/pull/845) [`9688ca3`](https://github.com/halfdomelabs/baseplate/commit/9688ca348fd995a228bff597069f58644d7e9459) Thanks [@kingston](https://github.com/kingston)! - Replace imperative compose/commit data service pattern with declarative transformer API and fix handling of JSON fields.

- [#849](https://github.com/halfdomelabs/baseplate/pull/849) [`8d30c14`](https://github.com/halfdomelabs/baseplate/commit/8d30c145ce5d72dcfc038ff076ed0746d2d763cc) Thanks [@kingston](https://github.com/kingston)! - Change default relation onDelete from Cascade to Restrict

- [#842](https://github.com/halfdomelabs/baseplate/pull/842) [`adc5f55`](https://github.com/halfdomelabs/baseplate/commit/adc5f55dbf3a1451f4402cd6bd126e15f60b8ed8) Thanks [@kingston](https://github.com/kingston)! - Upgrade Prisma to 7.5.0 and fix flaky E2E sync test

- [#865](https://github.com/halfdomelabs/baseplate/pull/865) [`c7131f5`](https://github.com/halfdomelabs/baseplate/commit/c7131f5caebda203ece99d30fcf2d58ead3abdb8) Thanks [@kingston](https://github.com/kingston)! - Add UUID v7 support by replacing `genUuid` boolean with `defaultGeneration` enum (`none` | `uuidv4` | `uuidv7`), leveraging PostgreSQL 18's native `uuidv7()` function

- Updated dependencies [[`8dcf7b3`](https://github.com/halfdomelabs/baseplate/commit/8dcf7b3c909672487bad61b7a4465d1860092363), [`87a2218`](https://github.com/halfdomelabs/baseplate/commit/87a2218266f957bb4beacd6b13cb3d610fd15a41), [`c7131f5`](https://github.com/halfdomelabs/baseplate/commit/c7131f5caebda203ece99d30fcf2d58ead3abdb8)]:
  - @baseplate-dev/utils@0.6.5
  - @baseplate-dev/core-generators@0.6.5
  - @baseplate-dev/sync@0.6.5

## 0.6.4

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.6.4
  - @baseplate-dev/sync@0.6.4
  - @baseplate-dev/utils@0.6.4

## 0.6.3

### Patch Changes

- [#835](https://github.com/halfdomelabs/baseplate/pull/835) [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931) Thanks [@kingston](https://github.com/kingston)! - Add .env.local support for backend projects - adds .env.local to gitignore and loads it via --env-file-if-exists flag in dev scripts

- [#835](https://github.com/halfdomelabs/baseplate/pull/835) [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931) Thanks [@kingston](https://github.com/kingston)! - Add support for indexes on tables, mirroring the existing unique constraints implementation

- [#835](https://github.com/halfdomelabs/baseplate/pull/835) [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931) Thanks [@kingston](https://github.com/kingston)! - Extract Sentry into standalone plugin package `@baseplate-dev/plugin-observability` and add migration to auto-enable Sentry plugin on existing projects

- [#835](https://github.com/halfdomelabs/baseplate/pull/835) [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931) Thanks [@kingston](https://github.com/kingston)! - Extract Stripe into standalone `@baseplate-dev/plugin-payments` package. Stripe is now managed through the plugin system instead of the `enableStripe` boolean on backend app config. Includes migration to automatically convert existing projects. Overhaul Stripe implementation to provide billing support.

- [#835](https://github.com/halfdomelabs/baseplate/pull/835) [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931) Thanks [@kingston](https://github.com/kingston)! - Remove Altair GraphQL IDE support in favor of the built-in GraphiQL interface provided by GraphQL Yoga

- Updated dependencies [[`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931)]:
  - @baseplate-dev/sync@0.6.3
  - @baseplate-dev/core-generators@0.6.3
  - @baseplate-dev/utils@0.6.3

## 0.6.2

### Patch Changes

- Reset version to 0.6.2 to fix accidental major version bumps caused by missing changeset fixed-group configuration.

## 0.6.1

### Patch Changes

- [#808](https://github.com/halfdomelabs/baseplate/pull/808) [`c371612`](https://github.com/halfdomelabs/baseplate/commit/c37161281c660a799a2a74537cd751fd58f3b05f) Thanks [@kingston](https://github.com/kingston)! - Improve data operations DX: rename `ModelQuery` to `ModelInclude`, fix `GetPayload` to eliminate `Payload | {}` union, and use intermediate variable for commit results. Fix type error for relation-less models by omitting query spread from execute callbacks.

- [#806](https://github.com/halfdomelabs/baseplate/pull/806) [`0b973f3`](https://github.com/halfdomelabs/baseplate/commit/0b973f3b9cb03fa1c49ceb49839b210466ecbbc7) Thanks [@kingston](https://github.com/kingston)! - Add bypass roles support to query filters for global role handling

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.6.1
  - @baseplate-dev/sync@0.6.1
  - @baseplate-dev/utils@0.6.1

## 0.6.0

### Minor Changes

- [#796](https://github.com/halfdomelabs/baseplate/pull/796) [`8258b27`](https://github.com/halfdomelabs/baseplate/commit/8258b278e9a25a6e4bd5039a134238d071a63ecd) Thanks [@kingston](https://github.com/kingston)! - Add query filter code generation for instance-level authorization on GraphQL queries

### Patch Changes

- [#783](https://github.com/halfdomelabs/baseplate/pull/783) [`bd1095e`](https://github.com/halfdomelabs/baseplate/commit/bd1095e52dc3cecdb40bf84a906490a7c92fec40) Thanks [@kingston](https://github.com/kingston)! - Add offset pagination (skip/take) to list queries and optional count query generation

- [#802](https://github.com/halfdomelabs/baseplate/pull/802) [`801c706`](https://github.com/halfdomelabs/baseplate/commit/801c7066f7e943c026f03e71b8d39242036e0cad) Thanks [@kingston](https://github.com/kingston)! - Update prettier to ignore unchanged files in output

- [#781](https://github.com/halfdomelabs/baseplate/pull/781) [`1225fda`](https://github.com/halfdomelabs/baseplate/commit/1225fdace3e8da20152e0e78c4decf0c063faa56) Thanks [@kingston](https://github.com/kingston)! - Refactor data services from factory pattern to composable compose/commit pattern
  - Replace `defineCreateOperation`/`defineUpdateOperation`/`defineDeleteOperation` with explicit `composeCreate`/`commitCreate`, `composeUpdate`/`commitUpdate`, and `commitDelete` functions
  - Export Zod schemas separately (`generateCreateSchema`/`generateUpdateSchema`) for use in GraphQL input validation
  - Remove `skipValidation` option from service output methods
  - Add `field-utils.ts`, `commit-operations.ts`, and `compose-operations.ts` templates; remove `define-operations.ts`

- [#778](https://github.com/halfdomelabs/baseplate/pull/778) [`d6be7a9`](https://github.com/halfdomelabs/baseplate/commit/d6be7a97b5e6970be674bf9b49eddf1499b51f04) Thanks [@kingston](https://github.com/kingston)! - Upgrade packages to fix security vulnerabilities
  - @aws-sdk/client-s3, @aws-sdk/lib-storage, @aws-sdk/s3-presigned-post, @aws-sdk/s3-request-presigner: 3.990.0 → 3.995.0 (fixes fast-xml-parser CVE-2025-69873 critical, CVE DoS high)
  - postmark: 4.0.5 → 4.0.7 (fixes axios DoS vulnerability)
  - fastify-auth0-verify: 3.0.0 → 4.1.0 (updates @fastify/jwt to v10)

- [#802](https://github.com/halfdomelabs/baseplate/pull/802) [`801c706`](https://github.com/halfdomelabs/baseplate/commit/801c7066f7e943c026f03e71b8d39242036e0cad) Thanks [@kingston](https://github.com/kingston)! - Add `isAuthenticated` boolean to authorizer expression DSL and AuthContext. Warn when `hasRole('user')` is used, suggesting `isAuthenticated` instead.

- [#802](https://github.com/halfdomelabs/baseplate/pull/802) [`801c706`](https://github.com/halfdomelabs/baseplate/commit/801c7066f7e943c026f03e71b8d39242036e0cad) Thanks [@kingston](https://github.com/kingston)! - Add nested authorizer expressions: `hasRole(model.relation, 'role')` and `hasSomeRole(model.relation, ['role1', 'role2'])` for checking roles on related model authorizers, with autocomplete and linter support.

- [#777](https://github.com/halfdomelabs/baseplate/pull/777) [`dc238be`](https://github.com/halfdomelabs/baseplate/commit/dc238be00158a528a60d9e6ef9cec32b2d8297be) Thanks [@kingston](https://github.com/kingston)! - Add per-field authorization support for GraphQL object type fields

- [#793](https://github.com/halfdomelabs/baseplate/pull/793) [`6e2675d`](https://github.com/halfdomelabs/baseplate/commit/6e2675d2166ac9bf470486efdc6a0e48df9bcc6d) Thanks [@kingston](https://github.com/kingston)! - Move mutation authorization from GraphQL-level to service-level, add compact grid-based role picker UI, filter system role from auth pickers, and hide disabled service methods from GraphQL mutations section

- [#800](https://github.com/halfdomelabs/baseplate/pull/800) [`83c713b`](https://github.com/halfdomelabs/baseplate/commit/83c713b075eca2abc946e74bf3f03e515e601eba) Thanks [@kingston](https://github.com/kingston)! - Upgrade fastify and related packages
  - fastify: 5.7.4 → 5.8.1 (includes security fix CVE-2026-3419)
  - @fastify/helmet: 13.0.0 → 13.0.2
  - @fastify/websocket: 11.0.1 → 11.2.0
  - @fastify/request-context: 6.0.1 → 6.2.1
  - @fastify/formbody: 8.0.1 → 8.0.2
  - @fastify/cookie: 11.0.1 → 11.0.2
  - altair-fastify-plugin: 8.0.4 → 8.5.1

- [#775](https://github.com/halfdomelabs/baseplate/pull/775) [`78315cc`](https://github.com/halfdomelabs/baseplate/commit/78315ccd9b0b0330cd2d08584c6d5ec516d641e3) Thanks [@kingston](https://github.com/kingston)! - Upgrade Sentry to v10, react-hook-form, and es-toolkit
  - @sentry/react: 9.17.0 → 10.39.0
  - @sentry/core: 9.17.0 → 10.39.0
  - @sentry/node: 9.17.0 → 10.39.0
  - @sentry/profiling-node: 9.17.0 → 10.39.0
  - @pothos/tracing-sentry: 1.1.1 → 1.1.4
  - react-hook-form: 7.60.0 → 7.71.1
  - es-toolkit: 1.31.0 → 1.44.0

- [#773](https://github.com/halfdomelabs/baseplate/pull/773) [`2104145`](https://github.com/halfdomelabs/baseplate/commit/210414588d8b1f6816c45054be3b7eea5763b5ce) Thanks [@kingston](https://github.com/kingston)! - Upgrade zod to 4.3.6
  - zod: 4.1.13 → 4.3.6

- Updated dependencies [[`ee7ee0e`](https://github.com/halfdomelabs/baseplate/commit/ee7ee0e552090612190eb4446a52c30f4eefce6a), [`801c706`](https://github.com/halfdomelabs/baseplate/commit/801c7066f7e943c026f03e71b8d39242036e0cad), [`cad5352`](https://github.com/halfdomelabs/baseplate/commit/cad535239b47080e30f894383cc330e37213a76c), [`cad5352`](https://github.com/halfdomelabs/baseplate/commit/cad535239b47080e30f894383cc330e37213a76c)]:
  - @baseplate-dev/utils@0.6.0
  - @baseplate-dev/core-generators@0.6.0
  - @baseplate-dev/sync@0.6.0

## 0.5.3

### Patch Changes

- Updated dependencies [[`cb2446e`](https://github.com/halfdomelabs/baseplate/commit/cb2446e235794bf5d45a1671ae320ccce12eb504), [`6c190fe`](https://github.com/halfdomelabs/baseplate/commit/6c190fe50240f0ddc984af757b7900d053433bb1), [`254d675`](https://github.com/halfdomelabs/baseplate/commit/254d675079930e5b569bf1c0c4576f1459d23a03), [`9129381`](https://github.com/halfdomelabs/baseplate/commit/9129381e17504136837d07deb9958708791da43e)]:
  - @baseplate-dev/core-generators@0.5.3
  - @baseplate-dev/sync@0.5.3
  - @baseplate-dev/utils@0.5.3

## 0.5.2

### Patch Changes

- [#753](https://github.com/halfdomelabs/baseplate/pull/753) [`ef1354d`](https://github.com/halfdomelabs/baseplate/commit/ef1354da11e2c48a80af03f44834555ce63a2948) Thanks [@kingston](https://github.com/kingston)! - Add prisma-model-authorizer generator that produces model authorizer files from authorizer role configuration
  - New `prisma/prisma-model-authorizer` generator in fastify-generators
  - Expression codegen utility to transform DSL expressions to TypeScript code
  - Compiler wiring to instantiate generator per model with authorizer roles

- [#749](https://github.com/halfdomelabs/baseplate/pull/749) [`683eb15`](https://github.com/halfdomelabs/baseplate/commit/683eb15c2c37259266959e0760b419e07f70a27e) Thanks [@kingston](https://github.com/kingston)! - Add rate limiting plugin for Baseplate projects

  This release introduces a new rate limiting plugin that provides:
  - **Rate Limiting Service**: `createRateLimiter` and `memoizeRateLimiter` functions for flexible rate limiting
  - **Prisma/PostgreSQL Backend**: Uses `rate-limiter-flexible` with Prisma storage
  - **TooManyRequestsError**: New HTTP error class with `Retry-After` header support in error-handler-service
  - **Model Merger**: Automatically creates the `RateLimiterFlexible` model via the project builder UI
  - **Type-Safe API**: Full TypeScript support for rate limiter configuration and results

  The auth plugin now supports rate limiting for login attempts via the rate-limit plugin integration.

- [#760](https://github.com/halfdomelabs/baseplate/pull/760) [`938a7b1`](https://github.com/halfdomelabs/baseplate/commit/938a7b113550a7a245b65b5dfe3cc641f11096b7) Thanks [@kingston](https://github.com/kingston)! - Simplify scalarField helper by removing unused transform option

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

- Updated dependencies [[`02740a6`](https://github.com/halfdomelabs/baseplate/commit/02740a6e230c7fbf28fc768543353e847671c51b), [`dd40bcd`](https://github.com/halfdomelabs/baseplate/commit/dd40bcd219c79f0cd7b66c0427c77deda0664072), [`7d1a9d6`](https://github.com/halfdomelabs/baseplate/commit/7d1a9d6d381279434f2ac632e9f8accde34dda25), [`63bd074`](https://github.com/halfdomelabs/baseplate/commit/63bd074b3b24b0978d4271a5bc76a8531b0f60c2)]:
  - @baseplate-dev/core-generators@0.5.2
  - @baseplate-dev/sync@0.5.2
  - @baseplate-dev/utils@0.5.2

## 0.5.1

### Patch Changes

- [#740](https://github.com/halfdomelabs/baseplate/pull/740) [`2de5d5c`](https://github.com/halfdomelabs/baseplate/commit/2de5d5c43c5354571d50707a99b4028ff8792534) Thanks [@kingston](https://github.com/kingston)! - Add email plugin with Postmark implementation for queue-based email delivery
  - Add `@baseplate-dev/plugin-email/transactional-lib` library type for generating transactional email libraries
  - Include reusable email components (Button, Heading, Text, Link, Divider, Section, Layout)

- [#741](https://github.com/halfdomelabs/baseplate/pull/741) [`ecebd3b`](https://github.com/halfdomelabs/baseplate/commit/ecebd3bf50cfa2d2a62501e0be39c411b42bed25) Thanks [@kingston](https://github.com/kingston)! - Fix duplicate identifier bug in generated nested field buildData functions
  - Split `buildData` into separate `buildCreateData` and `buildUpdateData` functions
  - Each function now has its own scope, avoiding duplicate identifier errors when FK fields are destructured
  - Use `Promise.all` for parallel execution of buildCreateData and buildUpdateData

- [#739](https://github.com/halfdomelabs/baseplate/pull/739) [`ff4203e`](https://github.com/halfdomelabs/baseplate/commit/ff4203e45a057b25a0ded5ecb3e1c07f5c7108b4) Thanks [@kingston](https://github.com/kingston)! - Fix stale data bug in data operations when afterExecute/afterCommit hooks modify related records
  - Add conditional re-fetch after hooks complete when query includes relations
  - Add required `getWhereUnique` to `CreateOperationConfig` for ID extraction
  - Extend `findUnique` in `GenericPrismaDelegate` to accept optional `include`

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.5.1
  - @baseplate-dev/sync@0.5.1
  - @baseplate-dev/utils@0.5.1

## 0.5.0

### Patch Changes

- [#732](https://github.com/halfdomelabs/baseplate/pull/732) [`fbabdec`](https://github.com/halfdomelabs/baseplate/commit/fbabdecf6715c21799d1c224b3a2162ef1f49797) Thanks [@kingston](https://github.com/kingston)! - Remove root: 'src/' from vitest.config.ts

- [#736](https://github.com/halfdomelabs/baseplate/pull/736) [`d09175d`](https://github.com/halfdomelabs/baseplate/commit/d09175dc41d33fb0a818d53c2e2da899430a48cd) Thanks [@kingston](https://github.com/kingston)! - Move scripts directory from `scripts/` to `src/scripts/` for fastify-generated projects, allowing TypeScript files to compile alongside the rest of the app and use `@src/` imports

- Updated dependencies [[`fbabdec`](https://github.com/halfdomelabs/baseplate/commit/fbabdecf6715c21799d1c224b3a2162ef1f49797), [`9b31726`](https://github.com/halfdomelabs/baseplate/commit/9b31726ee0dce77dc7b16fa334eb597d86349599), [`97bd14e`](https://github.com/halfdomelabs/baseplate/commit/97bd14e381206b54e55c22264d1d406e83146146), [`c7d373e`](https://github.com/halfdomelabs/baseplate/commit/c7d373ebaaeda2522515fdaeae0d37d0cd9ce7fe), [`2d5abd5`](https://github.com/halfdomelabs/baseplate/commit/2d5abd53fccfc2b15f8142fc796c5e4ea4c2f92a), [`8bfc742`](https://github.com/halfdomelabs/baseplate/commit/8bfc742b8a93393a5539babfd11b97a88ee9c39e)]:
  - @baseplate-dev/core-generators@0.5.0
  - @baseplate-dev/sync@0.5.0
  - @baseplate-dev/utils@0.5.0

## 0.4.4

### Patch Changes

- [#726](https://github.com/halfdomelabs/baseplate/pull/726) [`ec2f1e9`](https://github.com/halfdomelabs/baseplate/commit/ec2f1e9716e84cd4a901c071eacf4971436962d9) Thanks [@kingston](https://github.com/kingston)! - Fix handling of Prisma scalar fields without options

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.4.4
  - @baseplate-dev/sync@0.4.4
  - @baseplate-dev/utils@0.4.4

## 0.4.3

### Patch Changes

- [#720](https://github.com/halfdomelabs/baseplate/pull/720) [`12d1e62`](https://github.com/halfdomelabs/baseplate/commit/12d1e625bc04256eeb2704faa3f36dfda00545f9) Thanks [@kingston](https://github.com/kingston)! - Use block syntax instead of arrow function implicit returns in generated data operation callbacks for better error diagnostics

- [#718](https://github.com/halfdomelabs/baseplate/pull/718) [`6e23a6f`](https://github.com/halfdomelabs/baseplate/commit/6e23a6f2ff99954eebcb78b450d0c18618aa0b54) Thanks [@kingston](https://github.com/kingston)! - Fix nestedOneToOneField to not error when setting to null on non-existent relation

  Previously, setting a nested one-to-one field to `null` would throw an error if the related record didn't exist, because Prisma's `delete: true` syntax requires the record to exist. Now the deletion is performed via an `afterExecute` hook using `deleteMany`, which is idempotent and won't error if no record exists.

- [#719](https://github.com/halfdomelabs/baseplate/pull/719) [`f1bab33`](https://github.com/halfdomelabs/baseplate/commit/f1bab3310fa8c00c645a6d9aca0a6a757cb661f1) Thanks [@kingston](https://github.com/kingston)! - Refactor authorization system to use ABAC pattern with string-based roles
  - Add `authorizerCache` and `authorizerModelCache` fields to ServiceContext via the `authorizer-utils` generator for caching authorization decisions
  - Remove `AuthRole` type and `extractRoles` config from pothos-auth generator as authorization now uses string-based roles with instance role functions
  - Add new authorizer utilities including `checkGlobalAuthorization`, `checkInstanceAuthorization`, and `createModelAuthorizer` for flexible authorization patterns

- [#717](https://github.com/halfdomelabs/baseplate/pull/717) [`83e4e7f`](https://github.com/halfdomelabs/baseplate/commit/83e4e7f60adf67480cebb4ff419c015ff282010d) Thanks [@kingston](https://github.com/kingston)! - Add support for generating vitest on web apps

- [#722](https://github.com/halfdomelabs/baseplate/pull/722) [`8622c4e`](https://github.com/halfdomelabs/baseplate/commit/8622c4e2b91788ad4a368c9f06f82a17ee1a29ed) Thanks [@kingston](https://github.com/kingston)! - Add support for generating files in package.json

- Updated dependencies [[`83e4e7f`](https://github.com/halfdomelabs/baseplate/commit/83e4e7f60adf67480cebb4ff419c015ff282010d), [`8622c4e`](https://github.com/halfdomelabs/baseplate/commit/8622c4e2b91788ad4a368c9f06f82a17ee1a29ed)]:
  - @baseplate-dev/core-generators@0.4.3
  - @baseplate-dev/sync@0.4.3
  - @baseplate-dev/utils@0.4.3

## 0.4.2

### Patch Changes

- [#711](https://github.com/halfdomelabs/baseplate/pull/711) [`bde61e3`](https://github.com/halfdomelabs/baseplate/commit/bde61e3e5dfc4d6d19c0d2a71491de4605cd2c20) Thanks [@kingston](https://github.com/kingston)! - Add BullMQ plugin as managed child of queue plugin
  - Create new BullMQ plugin (`@baseplate-dev/plugin-queue/bullmq`) following the pg-boss plugin pattern
  - Add migration (021) to migrate `enableBullQueue` from backend app config to queue/bullmq plugin config
  - Remove old `bullMqGenerator` and `fastifyBullBoardGenerator` from fastify-generators
  - Remove Bull Board integration (to be replaced with local alternative in the future)
  - Remove `enableBullQueue` option from backend app schema and UI

- [#701](https://github.com/halfdomelabs/baseplate/pull/701) [`e8576b9`](https://github.com/halfdomelabs/baseplate/commit/e8576b9ba5912acf9d81bcc1b18a0fbc8df91220) Thanks [@kingston](https://github.com/kingston)! - Upgrade Fastify to 5.6.2 and fastify-plugin to 5.1.0

- [#701](https://github.com/halfdomelabs/baseplate/pull/701) [`e8576b9`](https://github.com/halfdomelabs/baseplate/commit/e8576b9ba5912acf9d81bcc1b18a0fbc8df91220) Thanks [@kingston](https://github.com/kingston)! - Upgrade to Zod v4

- [#700](https://github.com/halfdomelabs/baseplate/pull/700) [`5d4ae05`](https://github.com/halfdomelabs/baseplate/commit/5d4ae05b1781100ee21c5a60784f0107014bade4) Thanks [@kingston](https://github.com/kingston)! - Pass service context to create/update/delete operations in data operations

- [#697](https://github.com/halfdomelabs/baseplate/pull/697) [`11fa86f`](https://github.com/halfdomelabs/baseplate/commit/11fa86fb8e7a209175f132b1b3d59cd24cf13d54) Thanks [@kingston](https://github.com/kingston)! - Ignore \*.map files from built output in package.json

- [#713](https://github.com/halfdomelabs/baseplate/pull/713) [`74529e7`](https://github.com/halfdomelabs/baseplate/commit/74529e7fffae8a70f8cfe801a1897204d010e291) Thanks [@kingston](https://github.com/kingston)! - Migrate Vitest global setup from single merged file to individual files per generator
  - Replace `globalSetupOperations` Map with `globalSetupFiles` array in vitest config provider
  - Vitest generator now always renders `global-setup-env.ts` for environment loading
  - Each generator (Redis, Prisma) now creates its own global setup file
  - Vitest config outputs `globalSetup` as an array with env file first, then sorted additional files

- [#714](https://github.com/halfdomelabs/baseplate/pull/714) [`2395821`](https://github.com/halfdomelabs/baseplate/commit/239582148fe92d80457a31021036fa1e2c51cf5d) Thanks [@kingston](https://github.com/kingston)! - Fix handling of data operations with falsy update values

- [#710](https://github.com/halfdomelabs/baseplate/pull/710) [`e426b52`](https://github.com/halfdomelabs/baseplate/commit/e426b52d37f04f71ca960eb4cad2246af0603bd3) Thanks [@kingston](https://github.com/kingston)! - Upgrade Prisma to v7
  - prisma: 6.17.1 → 7.2.0
  - @prisma/client: 6.17.1 → 7.2.0
  - @prisma/adapter-pg: 6.17.1 → 7.2.0
  - @pothos/plugin-prisma: 4.12.0 → 4.14.1

- Updated dependencies [[`795ee4c`](https://github.com/halfdomelabs/baseplate/commit/795ee4c18e7b393fb9247ced23a12de5e219ab15), [`e8576b9`](https://github.com/halfdomelabs/baseplate/commit/e8576b9ba5912acf9d81bcc1b18a0fbc8df91220), [`11fa86f`](https://github.com/halfdomelabs/baseplate/commit/11fa86fb8e7a209175f132b1b3d59cd24cf13d54), [`74529e7`](https://github.com/halfdomelabs/baseplate/commit/74529e7fffae8a70f8cfe801a1897204d010e291), [`4be6c7d`](https://github.com/halfdomelabs/baseplate/commit/4be6c7dc7d900c37585b93cf5bb7198de6a41f1f), [`4be6c7d`](https://github.com/halfdomelabs/baseplate/commit/4be6c7dc7d900c37585b93cf5bb7198de6a41f1f)]:
  - @baseplate-dev/sync@0.4.2
  - @baseplate-dev/core-generators@0.4.2
  - @baseplate-dev/utils@0.4.2

## 0.4.1

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.4.1
  - @baseplate-dev/sync@0.4.1
  - @baseplate-dev/utils@0.4.1

## 0.4.0

### Minor Changes

- [#692](https://github.com/halfdomelabs/baseplate/pull/692) [`c3c2a00`](https://github.com/halfdomelabs/baseplate/commit/c3c2a001d57a21f76e064af55941a43bedf26f18) Thanks [@kingston](https://github.com/kingston)! - Replace imperative CRUD service pattern with declarative, type-safe data operations architecture

  ## Overview

  This change migrates from manually-written imperative CRUD functions to a declarative, type-safe data operations system featuring composable field definitions and automatic type inference. This represents a fundamental architectural improvement in how Baseplate generates data access code.

  ## Key Changes

  ### Architecture Shift

  **Before**: Manual, imperative functions with explicit Prisma calls and complex data transformations

  ```typescript
  // 250+ lines of manual data handling
  export async function createUser({ data, query, context }) {
    const { roles, customer, userProfile, images, ...rest } = data;

    const customerOutput = await createOneToOneCreateData({ input: customer });
    const imagesOutput = await createOneToManyCreateData({
      /* complex config */
    });
    // ... more manual transformations

    return applyDataPipeOutput(
      [rolesOutput, customerOutput, userProfileOutput, imagesOutput],
      prisma.user.create({
        /* manually built data object */
      }),
    );
  }
  ```

  **After**: Declarative operations with composable field definitions

  ```typescript
  // ~100 lines with clear separation of concerns
  export const createUser = defineCreateOperation({
    model: 'user',
    fields: userInputFields,
    create: ({ tx, data, query }) =>
      tx.user.create({
        data,
        ...query,
      }),
  });
  ```

  ### Composable Field Definitions

  Field definitions are now centralized, reusable components:

  ```typescript
  export const userInputFields = {
    name: scalarField(z.string().nullish()),
    email: scalarField(z.string()),
    customer: nestedOneToOneField({
      buildData: (data) => data,
      fields: { stripeCustomerId: scalarField(z.string()) },
      getWhereUnique: (parentModel) => ({ id: parentModel.id }),
      model: 'customer',
      parentModel,
      relationName: 'user',
    }),
    images: nestedOneToManyField({
      buildData: (data) => data,
      fields: pick(userImageInputFields, ['id', 'caption', 'file']),
      getWhereUnique: (input) => (input.id ? { id: input.id } : undefined),
      model: 'userImage',
      parentModel,
      relationName: 'user',
    }),
  };
  ```

  ## Breaking Changes
  - **File naming**: Services now use `*-data-service.ts` instead of `*-crud.ts`
  - **Import paths**: New utilities from `@src/utils/data-operations/`
  - **Service signatures**: Remain compatible - same inputs and outputs

- [#680](https://github.com/halfdomelabs/baseplate/pull/680) [`ac912b3`](https://github.com/halfdomelabs/baseplate/commit/ac912b384559f48c3603976d070eb54c9f20fb9b) Thanks [@kingston](https://github.com/kingston)! - Switch backend to ESM instead of CommonJS. This may break some packages but
  most packages at this point are now ESM compatible.

### Patch Changes

- [#693](https://github.com/halfdomelabs/baseplate/pull/693) [`e79df28`](https://github.com/halfdomelabs/baseplate/commit/e79df28eb7ab0275da2f630edcb1243bee40b7a5) Thanks [@kingston](https://github.com/kingston)! - Use Zod schema defined in mutations instead of restrictObjectNulls to allow for cleaner mutations and validation

- [#676](https://github.com/halfdomelabs/baseplate/pull/676) [`e68624e`](https://github.com/halfdomelabs/baseplate/commit/e68624e9372480da767d220cae60d45d9ed3c636) Thanks [@kingston](https://github.com/kingston)! - Allow prisma.config.mts to gracefully handle missing .env files by checking file existence before calling loadEnvFile(), enabling pnpm prisma generate to run successfully in environments without .env files

- [#677](https://github.com/halfdomelabs/baseplate/pull/677) [`6daff18`](https://github.com/halfdomelabs/baseplate/commit/6daff18a033d2d78746984edebba4d8c6fe957a5) Thanks [@kingston](https://github.com/kingston)! - Upgrade Prisma to 6.17.1 and adopt the new Prisma generator architecture:
  - Updated to Prisma 6.17.1 for improved performance and features
  - Migrated Prisma generated client location from `node_modules/.prisma/client` to `@src/generated/prisma/client.js` for better control and type safety

- [#680](https://github.com/halfdomelabs/baseplate/pull/680) [`ac912b3`](https://github.com/halfdomelabs/baseplate/commit/ac912b384559f48c3603976d070eb54c9f20fb9b) Thanks [@kingston](https://github.com/kingston)! - Upgrade TSX to 4.20.6

- [#673](https://github.com/halfdomelabs/baseplate/pull/673) [`852c3a5`](https://github.com/halfdomelabs/baseplate/commit/852c3a5ff3a185e60efaeb2cbb90eed59a95ec2b) Thanks [@kingston](https://github.com/kingston)! - Replace custom Date/DateTime/UUID scalars with graphql-scalars package and add JSON/JSONObject scalar support

  This change migrates from custom scalar implementations to the well-maintained graphql-scalars package, providing:
  - **Reduced maintenance burden**: No custom scalar code to maintain
  - **Battle-tested implementations**: Comprehensive edge case handling from widely-used library
  - **Standards compliance**: RFC 3339 compliant Date/DateTime handling
  - **Better error messages**: Detailed validation error messages out of the box
  - **Additional scalars**: JSON and JSONObject scalars now available

  **Breaking Changes:**
  - Date scalar now uses RFC 3339 format (stricter than previous YYYY-MM-DD regex)
  - DateTime scalar automatically shifts non-UTC timezones to UTC
  - UUID scalar has more comprehensive validation

  **New Features:**
  - JSON scalar for any valid JSON value (objects, arrays, primitives, null)
  - JSONObject scalar for JSON objects only (rejects arrays and primitives)

  **Dependencies:**
  - Added graphql-scalars@1.23.0 to generated backend packages

- [#692](https://github.com/halfdomelabs/baseplate/pull/692) [`c3c2a00`](https://github.com/halfdomelabs/baseplate/commit/c3c2a001d57a21f76e064af55941a43bedf26f18) Thanks [@kingston](https://github.com/kingston)! - Remove support for password transformer since it is no longer used.

- [#680](https://github.com/halfdomelabs/baseplate/pull/680) [`ac912b3`](https://github.com/halfdomelabs/baseplate/commit/ac912b384559f48c3603976d070eb54c9f20fb9b) Thanks [@kingston](https://github.com/kingston)! - Upgrade ioredis to 5.8.1 and ioredis-mock to 8.13.0-

- [#693](https://github.com/halfdomelabs/baseplate/pull/693) [`e79df28`](https://github.com/halfdomelabs/baseplate/commit/e79df28eb7ab0275da2f630edcb1243bee40b7a5) Thanks [@kingston](https://github.com/kingston)! - Add support for validation plugin in Pothos

- Updated dependencies [[`839cbdf`](https://github.com/halfdomelabs/baseplate/commit/839cbdfc6ddc059aa86d24bf6ec5d8e95cce9042), [`c3c2a00`](https://github.com/halfdomelabs/baseplate/commit/c3c2a001d57a21f76e064af55941a43bedf26f18), [`c3c2a00`](https://github.com/halfdomelabs/baseplate/commit/c3c2a001d57a21f76e064af55941a43bedf26f18), [`6daff18`](https://github.com/halfdomelabs/baseplate/commit/6daff18a033d2d78746984edebba4d8c6fe957a5)]:
  - @baseplate-dev/sync@0.4.0
  - @baseplate-dev/core-generators@0.4.0
  - @baseplate-dev/utils@0.4.0

## 0.3.8

### Patch Changes

- [#671](https://github.com/halfdomelabs/baseplate/pull/671) [`fc93dd7`](https://github.com/halfdomelabs/baseplate/commit/fc93dd70c182ac99d1f025745d88a32d6de733f5) Thanks [@kingston](https://github.com/kingston)! - Upgrade Prisma to 6.16.2

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.3.8
  - @baseplate-dev/sync@0.3.8
  - @baseplate-dev/utils@0.3.8

## 0.3.7

### Patch Changes

- [#664](https://github.com/halfdomelabs/baseplate/pull/664) [`d6f70e0`](https://github.com/halfdomelabs/baseplate/commit/d6f70e03f539bd8687d9e9abfc0e7cef5c9e6e29) Thanks [@kingston](https://github.com/kingston)! - Fix cookie clearing by passing options to ensure secure cookies are properly cleared. The CookieStore interface now accepts optional CookieSerializeOptions when clearing cookies, and the auth module template now passes COOKIE_OPTIONS when clearing session cookies to maintain consistency with cookie creation.

- Updated dependencies [[`9508a8e`](https://github.com/halfdomelabs/baseplate/commit/9508a8ee75e33ea0c0632f3f5ef5621b020f530d)]:
  - @baseplate-dev/core-generators@0.3.7
  - @baseplate-dev/sync@0.3.7
  - @baseplate-dev/utils@0.3.7

## 0.3.6

### Patch Changes

- Updated dependencies [[`1186a21`](https://github.com/halfdomelabs/baseplate/commit/1186a21df267d112a84a42ff1d3c87b495452ce0)]:
  - @baseplate-dev/core-generators@0.3.6
  - @baseplate-dev/sync@0.3.6
  - @baseplate-dev/utils@0.3.6

## 0.3.5

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.3.5
  - @baseplate-dev/sync@0.3.5
  - @baseplate-dev/utils@0.3.5

## 0.3.4

### Patch Changes

- [#642](https://github.com/halfdomelabs/baseplate/pull/642) [`217de38`](https://github.com/halfdomelabs/baseplate/commit/217de385f3ac869c5ef740af32634db9bcab6b0c) Thanks [@kingston](https://github.com/kingston)! - Upgrade Prisma to 6.14.0

- [#646](https://github.com/halfdomelabs/baseplate/pull/646) [`67dba69`](https://github.com/halfdomelabs/baseplate/commit/67dba697439e6bc76b81522c133d920af4dbdbb1) Thanks [@kingston](https://github.com/kingston)! - Upgrade Zod to 3.25.76

- [#643](https://github.com/halfdomelabs/baseplate/pull/643) [`7d9e6d0`](https://github.com/halfdomelabs/baseplate/commit/7d9e6d01e0a9920cee4c4d499beeffc1c663494a) Thanks [@kingston](https://github.com/kingston)! - Upgrade to TypeScript 5.8 with erasable syntax only mode

  This upgrade modernizes the codebase with TypeScript 5.8, enables erasable syntax only mode for better performance, and updates runtime dependencies.

  **Key Changes:**
  - Upgraded TypeScript to version 5.8
  - Enabled `erasableSyntaxOnly` compiler option for improved build performance
  - Updated Node.js requirement to 22.18
  - Updated PNPM requirement to 10.15
  - Fixed parameter property syntax to be compatible with erasable syntax only mode

- Updated dependencies [[`67dba69`](https://github.com/halfdomelabs/baseplate/commit/67dba697439e6bc76b81522c133d920af4dbdbb1), [`7d9e6d0`](https://github.com/halfdomelabs/baseplate/commit/7d9e6d01e0a9920cee4c4d499beeffc1c663494a)]:
  - @baseplate-dev/sync@0.3.4
  - @baseplate-dev/core-generators@0.3.4
  - @baseplate-dev/utils@0.3.4

## 0.3.3

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.3.3
  - @baseplate-dev/sync@0.3.3
  - @baseplate-dev/utils@0.3.3

## 0.3.2

### Patch Changes

- [#635](https://github.com/halfdomelabs/baseplate/pull/635) [`04a4978`](https://github.com/halfdomelabs/baseplate/commit/04a49785642685ca4b56aec27dc0a18520674ef9) Thanks [@kingston](https://github.com/kingston)! - Upgrade GraphQL to 16.11.0

- [#633](https://github.com/halfdomelabs/baseplate/pull/633) [`cca138a`](https://github.com/halfdomelabs/baseplate/commit/cca138a84abbb901ab628bf571ae29211a180dbb) Thanks [@kingston](https://github.com/kingston)! - Upgrade graphql-yoga, envelop, and pothos packages to latest versions
  - @envelop/core: 5.0.1 → 5.3.0
  - @envelop/disable-introspection: 6.0.0 → 8.0.0
  - @envelop/types: 5.0.0 → 5.2.1
  - graphql-yoga: 5.6.1 → 5.15.1
  - @pothos/core: 4.3.0 → 4.8.1
  - @pothos/plugin-simple-objects: 4.1.0 → 4.1.3
  - @pothos/plugin-relay: 4.3.0 → 4.6.2
  - @pothos/plugin-prisma: 4.3.1 → 4.10.0

- Updated dependencies [[`b4c15b9`](https://github.com/halfdomelabs/baseplate/commit/b4c15b98a518c53828f81624764ba693def85faf)]:
  - @baseplate-dev/core-generators@0.3.2
  - @baseplate-dev/sync@0.3.2
  - @baseplate-dev/utils@0.3.2

## 0.3.1

### Patch Changes

- [#629](https://github.com/halfdomelabs/baseplate/pull/629) [`d79b0cf`](https://github.com/halfdomelabs/baseplate/commit/d79b0cfb9061dbeccc976a2f018b264849bef788) Thanks [@kingston](https://github.com/kingston)! - Add queue plugin with pg-boss implementation

  Introduces a new queue plugin that provides background job processing capabilities for Baseplate projects. The initial implementation uses pg-boss as the queue backend, providing:
  - **Queue Plugin Architecture**: Modular queue system with provider-based implementation pattern
  - **pg-boss Integration**: PostgreSQL-based queue system with robust job processing features
  - **Type-Safe Queue Definitions**: Full TypeScript support for queue job payloads and handlers
  - **Job Management Features**:
    - Delayed job execution
    - Retry logic with configurable backoff strategies (fixed or exponential)
    - Priority-based job processing
    - Repeatable/cron jobs with schedule patterns
  - **Worker Script Generation**: Automatic generation of worker scripts for processing background jobs
  - **Queue Registry Pattern**: Centralized queue management with automatic discovery
  - **Maintenance Operations**: Configurable job retention and cleanup policies
  - **Graceful Shutdown**: Proper cleanup and job completion on worker termination

  The plugin follows Baseplate's spec-implementation pattern, allowing for future queue backends while maintaining a consistent API.

- [#629](https://github.com/halfdomelabs/baseplate/pull/629) [`d79b0cf`](https://github.com/halfdomelabs/baseplate/commit/d79b0cfb9061dbeccc976a2f018b264849bef788) Thanks [@kingston](https://github.com/kingston)! - Improve package.json script naming conventions

  Updates the generated package.json scripts for better clarity and consistency:
  - **Development Scripts**:
    - `dev:server` - Runs the Fastify server in development mode
    - `dev:workers` - Runs background job workers in development mode
    - Both scripts now use `--env-file-if-exists` for optional .env file loading
  - **Script Utilities**:
    - `script:dev` - Generic development script runner with watch mode
    - `script:run` - Generic script runner for one-off executions
  - **Worker Scripts**:
    - `start:workers` - Production worker startup command

  These naming conventions make it clearer what each script does and follow a consistent pattern of `category:action` for better organization.

- Updated dependencies [[`d79b0cf`](https://github.com/halfdomelabs/baseplate/commit/d79b0cfb9061dbeccc976a2f018b264849bef788)]:
  - @baseplate-dev/core-generators@0.3.1
  - @baseplate-dev/sync@0.3.1
  - @baseplate-dev/utils@0.3.1

## 0.3.0

### Patch Changes

- [#626](https://github.com/halfdomelabs/baseplate/pull/626) [`8ec33fc`](https://github.com/halfdomelabs/baseplate/commit/8ec33fcdc8fea9cb20e79586b854bf075270ab53) Thanks [@kingston](https://github.com/kingston)! - Remove dotenv references and replace with native node --env-file option

- [#625](https://github.com/halfdomelabs/baseplate/pull/625) [`96a3099`](https://github.com/halfdomelabs/baseplate/commit/96a3099ff9eba05fc3b3618b54407014cc555dc2) Thanks [@kingston](https://github.com/kingston)! - Add ability to set Prisma seed scripts and add seed script for local auth users

- Updated dependencies [[`687a47e`](https://github.com/halfdomelabs/baseplate/commit/687a47e5e39abc5138ba3fc2d0db9cfee6e4dbfe), [`8ec33fc`](https://github.com/halfdomelabs/baseplate/commit/8ec33fcdc8fea9cb20e79586b854bf075270ab53), [`fbde70f`](https://github.com/halfdomelabs/baseplate/commit/fbde70ffbcae025318480e9607924978847fba2b)]:
  - @baseplate-dev/sync@0.3.0
  - @baseplate-dev/core-generators@0.3.0
  - @baseplate-dev/utils@0.3.0

## 0.2.6

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.2.6
  - @baseplate-dev/sync@0.2.6
  - @baseplate-dev/utils@0.2.6

## 0.2.5

### Patch Changes

- [#608](https://github.com/halfdomelabs/baseplate/pull/608) [`01c47c7`](https://github.com/halfdomelabs/baseplate/commit/01c47c77f039a463de03271de6461cd969d5a8e8) Thanks [@kingston](https://github.com/kingston)! - Fix pothos writer to write typed args correctly (t.arg.string instead of t.string)

- Updated dependencies [[`e0d690c`](https://github.com/halfdomelabs/baseplate/commit/e0d690c1e139f93a8ff60c9e0c90bc72cdf705a4), [`2aae451`](https://github.com/halfdomelabs/baseplate/commit/2aae45107cb6331234d14d8a6491b55e7f6d9f33)]:
  - @baseplate-dev/sync@0.2.5
  - @baseplate-dev/core-generators@0.2.5
  - @baseplate-dev/utils@0.2.5

## 0.2.4

### Patch Changes

- Updated dependencies [[`ffe791f`](https://github.com/halfdomelabs/baseplate/commit/ffe791f6ab44e82c8481f3a18df9262dec71cff6)]:
  - @baseplate-dev/utils@0.2.4
  - @baseplate-dev/core-generators@0.2.4
  - @baseplate-dev/sync@0.2.4

## 0.2.3

### Patch Changes

- [#598](https://github.com/halfdomelabs/baseplate/pull/598) [`69eea11`](https://github.com/halfdomelabs/baseplate/commit/69eea11c3662fbad9b8d2283d5127195c8379c07) Thanks [@kingston](https://github.com/kingston)! - Change environment names from long format to short abbreviations (development→dev, staging→stage, production→prod)

- Updated dependencies [[`f3bd169`](https://github.com/halfdomelabs/baseplate/commit/f3bd169b8debc52628179ca6ebd93c20b8a6f841), [`a506e88`](https://github.com/halfdomelabs/baseplate/commit/a506e88893bf395916ef3fbf6dd9dd7c0ff17acb), [`f0cb763`](https://github.com/halfdomelabs/baseplate/commit/f0cb7632f04bfb487722785fac7218d76d3b7e3b), [`059edf7`](https://github.com/halfdomelabs/baseplate/commit/059edf771755f1ff846494f238d777a9d1f7f5d7), [`059edf7`](https://github.com/halfdomelabs/baseplate/commit/059edf771755f1ff846494f238d777a9d1f7f5d7), [`de9e1b4`](https://github.com/halfdomelabs/baseplate/commit/de9e1b4f3a8a7dcf6b962781a0aa589eb970c7a8)]:
  - @baseplate-dev/core-generators@0.2.3
  - @baseplate-dev/sync@0.2.3
  - @baseplate-dev/utils@0.2.3

## 0.2.2

### Patch Changes

- Updated dependencies [[`f8c9284`](https://github.com/halfdomelabs/baseplate/commit/f8c9284752c12c6aab70481bf98e6fa402e61075), [`f8c9284`](https://github.com/halfdomelabs/baseplate/commit/f8c9284752c12c6aab70481bf98e6fa402e61075), [`dce88ac`](https://github.com/halfdomelabs/baseplate/commit/dce88ac8d1f951f7336c12c5e004107de3a23e97)]:
  - @baseplate-dev/utils@0.2.2
  - @baseplate-dev/sync@0.2.2
  - @baseplate-dev/core-generators@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies [[`d7d9985`](https://github.com/halfdomelabs/baseplate/commit/d7d998540ca5886259f93b5020c4d8939c5cdf5f)]:
  - @baseplate-dev/core-generators@0.2.1
  - @baseplate-dev/sync@0.2.1
  - @baseplate-dev/utils@0.2.1

## 0.2.0

### Patch Changes

- [#568](https://github.com/halfdomelabs/baseplate/pull/568) [`06b4faf`](https://github.com/halfdomelabs/baseplate/commit/06b4fafaf3d2ed848d959a9911b9bfa26702d4a3) Thanks [@kingston](https://github.com/kingston)! - Enable the import-x/consistent-type-specifier-style rule to clean up type imports

- [#574](https://github.com/halfdomelabs/baseplate/pull/574) [`f5d7a6f`](https://github.com/halfdomelabs/baseplate/commit/f5d7a6f781b1799bb8ad197973e5cec04f869264) Thanks [@kingston](https://github.com/kingston)! - Refactored naming of project paths to output paths to be clearer about their meaning

- [#570](https://github.com/halfdomelabs/baseplate/pull/570) [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9) Thanks [@kingston](https://github.com/kingston)! - Implement phase 1 of reverse template generator v2

- Updated dependencies [[`06b4faf`](https://github.com/halfdomelabs/baseplate/commit/06b4fafaf3d2ed848d959a9911b9bfa26702d4a3), [`f5d7a6f`](https://github.com/halfdomelabs/baseplate/commit/f5d7a6f781b1799bb8ad197973e5cec04f869264), [`fd63554`](https://github.com/halfdomelabs/baseplate/commit/fd635544eb6df0385501f61f3e51bce554633458), [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13), [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9), [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13), [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9)]:
  - @baseplate-dev/core-generators@0.2.0
  - @baseplate-dev/utils@0.2.0
  - @baseplate-dev/sync@0.2.0

## 0.1.3

### Patch Changes

- [#562](https://github.com/halfdomelabs/baseplate/pull/562) [`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad) Thanks [@kingston](https://github.com/kingston)! - Switch to Typescript project references for building/watching project

- Updated dependencies [[`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad)]:
  - @baseplate-dev/core-generators@0.1.3
  - @baseplate-dev/utils@0.1.3
  - @baseplate-dev/sync@0.1.3

## 0.1.2

### Patch Changes

- [#560](https://github.com/halfdomelabs/baseplate/pull/560) [`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8) Thanks [@kingston](https://github.com/kingston)! - Add README files to all packages and plugins explaining their purpose within the Baseplate monorepo.

- Updated dependencies [[`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8)]:
  - @baseplate-dev/sync@0.1.2
  - @baseplate-dev/core-generators@0.1.2
  - @baseplate-dev/utils@0.1.2

## 0.1.1

### Patch Changes

- [#559](https://github.com/halfdomelabs/baseplate/pull/559) [`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b) Thanks [@kingston](https://github.com/kingston)! - Rename workspace to @baseplate-dev/\* and reset versions to 0.1.0

- [#557](https://github.com/halfdomelabs/baseplate/pull/557) [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad) Thanks [@kingston](https://github.com/kingston)! - Update LICENSE to modified MPL-2.0 license

- Updated dependencies [[`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b), [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad)]:
  - @baseplate-dev/core-generators@0.1.1
  - @baseplate-dev/utils@0.1.1
  - @baseplate-dev/sync@0.1.1
