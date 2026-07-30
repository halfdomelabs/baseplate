# @baseplate-dev/project-builder-lib

## 0.6.15

### Patch Changes

- [#956](https://github.com/halfdomelabs/baseplate/pull/956) [`403874a`](https://github.com/halfdomelabs/baseplate/commit/403874a10f67120eb36badc93920359cb267dcb5) Thanks [@kingston](https://github.com/kingston)! - GraphQL list relation fields can now opt into orderBy arguments using the related model's sortable fields, and requesting ordering on a model with no sortable fields now fails with a clear error instead of generating an invalid schema.

- [#962](https://github.com/halfdomelabs/baseplate/pull/962) [`615c8e1`](https://github.com/halfdomelabs/baseplate/commit/615c8e173cede3cfa0298b92d5b84999ffedce5b) Thanks [@kingston](https://github.com/kingston)! - Tightened handling of indexed access across the codebase, fixing latent cases where a missing array element or record entry could surface as an undefined value in a field typed as required, such as unmatched regular expression capture groups and parsed command strings.

- [#959](https://github.com/halfdomelabs/baseplate/pull/959) [`9cdfaa9`](https://github.com/halfdomelabs/baseplate/commit/9cdfaa9e3702c8a569c5dac739877dc8330a8f73) Thanks [@kingston](https://github.com/kingston)! - Sortable and filterable field selections have moved out of the list query settings into a new model-level Sorting & Filtering section, since list queries and list relations sort by the same fields, and models can now define a default sort that orders results whenever a caller supplies no orderBy — including on relations and queries that expose no orderBy argument at all. Existing projects migrate automatically.

- [#963](https://github.com/halfdomelabs/baseplate/pull/963) [`9139686`](https://github.com/halfdomelabs/baseplate/commit/91396867ec7832068aa6a5d19d038dcd1f04ec5c) Thanks [@kingston](https://github.com/kingston)! - Support configuring a default and maximum page size for paginated GraphQL endpoints so large objects can't be fetched en masse, applied to list queries, connection queries, and paginated list relations alike; setting only a maximum also applies it as the default, since a cap alone would be bypassed by omitting the argument. Cursor pagination can now be enabled independently of offset pagination — a model can expose a list query, a connection query, or both, with where filtering and ordering available to either.

- Updated dependencies [[`615c8e1`](https://github.com/halfdomelabs/baseplate/commit/615c8e173cede3cfa0298b92d5b84999ffedce5b)]:
  - @baseplate-dev/sync@0.6.15
  - @baseplate-dev/utils@0.6.15
  - @baseplate-dev/ui-components@0.6.15

## 0.6.14

### Patch Changes

- [#953](https://github.com/halfdomelabs/baseplate/pull/953) [`e7ee500`](https://github.com/halfdomelabs/baseplate/commit/e7ee500e5a2d78778bd3bdb79b4f2f40b5f040ef) Thanks [@kingston](https://github.com/kingston)! - Support one-to-many relations in model authorizer expressions, so `hasRole(model.members, 'owner')` now delegates to a role on a has-many relation ("some related record grants the role") instead of failing to build, and the expression editor suggests has-many relations for `hasRole`/`hasSomeRole` alongside belongs-to ones.

- [#953](https://github.com/halfdomelabs/baseplate/pull/953) [`e7ee500`](https://github.com/halfdomelabs/baseplate/commit/e7ee500e5a2d78778bd3bdb79b4f2f40b5f040ef) Thanks [@kingston](https://github.com/kingston)! - Annotate expression fields in the entity schema returned by `get-entity-schema`, so authorization expressions are identified as a DSL with a short syntax summary and a pointer to the full grammar instead of appearing as a plain string.

- Updated dependencies []:
  - @baseplate-dev/sync@0.6.14
  - @baseplate-dev/ui-components@0.6.14
  - @baseplate-dev/utils@0.6.14

## 0.6.13

### Patch Changes

- [#950](https://github.com/halfdomelabs/baseplate/pull/950) [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3) Thanks [@kingston](https://github.com/kingston)! - Added opt-in pagination, sorting, and filtering to generated GraphQL queries, configurable per model in the GraphQL section of the model editor. Enabling "Connection" generates a Relay-style `<model>sConnection(first, after, last, before)` query backed by Pothos's `t.prismaConnection`; `orderBy` adds multi-field sorting over the fields you mark sortable, with the model's ID field(s) appended as a stable cursor tiebreaker; `where` adds filtering over the fields you mark filterable, composing with row-level authorization and capped in depth and breadth; and to-many relation fields gain optional `skip`/`take` args (e.g. `user.todoLists(skip, take)`).

- [#922](https://github.com/halfdomelabs/baseplate/pull/922) [`f596b4b`](https://github.com/halfdomelabs/baseplate/commit/f596b4b43bd9f0ecb7d5379739b0e36a01c40c70) Thanks [@kingston](https://github.com/kingston)! - Add a stage-patch-entity MCP action that stages a partial entity update, replacing only the provided root-level fields while preserving the rest of the entity. This complements stage-update-entity, which replaces the whole entity.

- [#924](https://github.com/halfdomelabs/baseplate/pull/924) [`d0f8726`](https://github.com/halfdomelabs/baseplate/commit/d0f87265f16bfbde6c1525b0655850e906a7c3ed) Thanks [@kingston](https://github.com/kingston)! - Consolidated model authorization into a single generated policy per model. Each model emits one `createModelPolicy` file that declares its roles once and derives both the boolean instance check and the Prisma `where` filter from the same declaration, with action helpers grouped under `policy.actions`; reads filter through the policy, and authorized updates and deletes compose the grant into the query as one atomic operation, hiding an unauthorized row as a 404. Role predicates support scalar matches, relation filters, cached delegation to a parent model's policy via `r.via`, global-role and authenticated checks, and `and`/`or` combinations, and both policies and `r.via` delegation work with composite primary keys and multi-column foreign keys. The `r.userMatch`/`r.userWhere` verbs key a predicate on the authenticated user's id and only run for an authenticated principal, so an anonymous caller is denied without a per-role null guard.

- [#940](https://github.com/halfdomelabs/baseplate/pull/940) [`13b78ca`](https://github.com/halfdomelabs/baseplate/commit/13b78caae04ad84441ca48d98a0b9e17135485d9) Thanks [@kingston](https://github.com/kingston)! - Web app per-app plugin settings (upload components, notifications) are now contributed by their plugins through a generic extension point and stored under `pluginData` on the web app config, instead of hardcoded flags on the core web app schema. The web app settings page renders these toggles only when the owning plugin is enabled. Existing projects are migrated automatically, preserving any enabled toggles; the unused `includeAuth` flag is removed.

- Updated dependencies [[`80c1474`](https://github.com/halfdomelabs/baseplate/commit/80c1474f8903f0609f8d7484b0d0be8b59d4f6c0), [`03cc94e`](https://github.com/halfdomelabs/baseplate/commit/03cc94e0308d441404b4e84457e678b4d19c47b8), [`47765e5`](https://github.com/halfdomelabs/baseplate/commit/47765e58ebd1979f94f0b1889efe539bcfe3e7f1), [`9548f2d`](https://github.com/halfdomelabs/baseplate/commit/9548f2d12af830e28187efed4b5a27d42020b289)]:
  - @baseplate-dev/utils@0.6.13
  - @baseplate-dev/ui-components@0.6.13
  - @baseplate-dev/sync@0.6.13

## 0.6.12

### Patch Changes

- [#912](https://github.com/halfdomelabs/baseplate/pull/912) [`0620a2b`](https://github.com/halfdomelabs/baseplate/commit/0620a2b2a59a4b401a9d9268f596776f4da09a9b) Thanks [@kingston](https://github.com/kingston)! - Fixes for MCP staging: always default `enums` to `[]` to prevent runtime errors and make corrupt drafts recoverable.

- [#912](https://github.com/halfdomelabs/baseplate/pull/912) [`0620a2b`](https://github.com/halfdomelabs/baseplate/commit/0620a2b2a59a4b401a9d9268f596776f4da09a9b) Thanks [@kingston](https://github.com/kingston)! - Fix `FeatureUtils.ensureFeatureByNameRecursively` creating duplicate nested features.

- Updated dependencies []:
  - @baseplate-dev/sync@0.6.12
  - @baseplate-dev/ui-components@0.6.12
  - @baseplate-dev/utils@0.6.12

## 0.6.11

### Patch Changes

- [#902](https://github.com/halfdomelabs/baseplate/pull/902) [`cc296f4`](https://github.com/halfdomelabs/baseplate/commit/cc296f4737d0462f3536dda27ae9eb297f799b8b) Thanks [@kingston](https://github.com/kingston)! - Upgrade oxc tooling to latest and clean up lint rules (ENG-1164)

- Updated dependencies []:
  - @baseplate-dev/sync@0.6.11
  - @baseplate-dev/ui-components@0.6.11
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

- [#886](https://github.com/halfdomelabs/baseplate/pull/886) [`30765f0`](https://github.com/halfdomelabs/baseplate/commit/30765f079c46019d9c91fb96f1b3c399b4dc8759) Thanks [@kingston](https://github.com/kingston)! - Migrate from @originjs/vite-plugin-federation to @module-federation/vite for active maintenance and Vite 7+ peer-range support. As part of this, `@baseplate-dev/project-builder-lib` and `@baseplate-dev/ui-components` now declare `react`, `react-dom`, `zod` (and `@baseplate-dev/ui-components` from project-builder-lib) as peer dependencies — these were already required by consumers but are now explicit, so the federation runtime can dedupe them across host and remotes.

- [#894](https://github.com/halfdomelabs/baseplate/pull/894) [`4b38b79`](https://github.com/halfdomelabs/baseplate/commit/4b38b79282a32414c688b1f6212b88c0c75d413d) Thanks [@kingston](https://github.com/kingston)! - Add `pluginDefaultsSpec` — a new platform spec that lets a plugin declare how to enable itself with sensible defaults. The setup wizard now invokes each plugin's registered builder instead of trying to enable with `{}`, which previously crashed Zod validation for plugins that require feature refs (rate-limit, storage). Rate-limit auto-scaffolds a `system/rate-limit` feature; storage auto-scaffolds a `storage` feature. Sentry, Stripe, and AI dev-agents register matching builders so the wizard treats every plugin uniformly.

- Updated dependencies [[`f5ad6d2`](https://github.com/halfdomelabs/baseplate/commit/f5ad6d2ff994ecdd03f790b7e5c0915ddc7660c5), [`db93095`](https://github.com/halfdomelabs/baseplate/commit/db93095c6a9846d1e583832b70b85898ae785b10), [`30765f0`](https://github.com/halfdomelabs/baseplate/commit/30765f079c46019d9c91fb96f1b3c399b4dc8759), [`4b38b79`](https://github.com/halfdomelabs/baseplate/commit/4b38b79282a32414c688b1f6212b88c0c75d413d), [`e8da347`](https://github.com/halfdomelabs/baseplate/commit/e8da347b3bd799b31c5d04d1317dedaa8c14e412), [`62df439`](https://github.com/halfdomelabs/baseplate/commit/62df43917263034e621f29fb261d2b93ca9edf23)]:
  - @baseplate-dev/sync@0.6.10
  - @baseplate-dev/ui-components@0.6.10
  - @baseplate-dev/utils@0.6.10

## 0.6.9

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/sync@0.6.9
  - @baseplate-dev/ui-components@0.6.9
  - @baseplate-dev/utils@0.6.9

## 0.6.8

### Patch Changes

- Updated dependencies [[`04006df`](https://github.com/halfdomelabs/baseplate/commit/04006df7b2c9d124c83264d40aaeaa2a71558035)]:
  - @baseplate-dev/ui-components@0.6.8
  - @baseplate-dev/sync@0.6.8
  - @baseplate-dev/utils@0.6.8

## 0.6.7

### Patch Changes

- Updated dependencies [[`335e063`](https://github.com/halfdomelabs/baseplate/commit/335e063b85676c9a55635ade6cf9b7b38bdd431d)]:
  - @baseplate-dev/ui-components@0.6.7
  - @baseplate-dev/sync@0.6.7
  - @baseplate-dev/utils@0.6.7

## 0.6.6

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/sync@0.6.6
  - @baseplate-dev/ui-components@0.6.6
  - @baseplate-dev/utils@0.6.6

## 0.6.5

### Patch Changes

- [#834](https://github.com/halfdomelabs/baseplate/pull/834) [`37b6d8f`](https://github.com/halfdomelabs/baseplate/commit/37b6d8fd76086dab2953e12e48543334c5056f15) Thanks [@kingston](https://github.com/kingston)! - Add `accountsFeatureRef` field to auth plugin, separating user data models (User, UserAccount, UserRole, UserSession, AuthVerification) from auth infrastructure code. Defaults to a new `accounts` feature alongside the existing `auth` feature. Includes schema migration 029 to backfill existing projects.

- [#869](https://github.com/halfdomelabs/baseplate/pull/869) [`860b82d`](https://github.com/halfdomelabs/baseplate/commit/860b82da0466386ad11128c619595179ee76d0a4) Thanks [@kingston](https://github.com/kingston)! - Add AI development agents plugin that generates AGENTS.md, .agents/ directory, and conditionally CLAUDE.md for Baseplate projects. Also adds `rootCompilerSpec` to enable plugins to contribute generators to the monorepo root package.

- [#854](https://github.com/halfdomelabs/baseplate/pull/854) [`9708637`](https://github.com/halfdomelabs/baseplate/commit/97086370718861d2c3170ec6d83af84793fbd09e) Thanks [@kingston](https://github.com/kingston)! - Add optional description field to enum values that flows through to Pothos GraphQL enum type definitions

- [#854](https://github.com/halfdomelabs/baseplate/pull/854) [`9708637`](https://github.com/halfdomelabs/baseplate/commit/97086370718861d2c3170ec6d83af84793fbd09e) Thanks [@kingston](https://github.com/kingston)! - Add case validation rules to enum names (PascalCase), enum value names (CONSTANT_CASE), and embedded CRUD form names (camelCase)

- [#868](https://github.com/halfdomelabs/baseplate/pull/868) [`8dcf7b3`](https://github.com/halfdomelabs/baseplate/commit/8dcf7b3c909672487bad61b7a4465d1860092363) Thanks [@kingston](https://github.com/kingston)! - Add get-plugin-info MCP action and improve configure-plugin usability

- [#844](https://github.com/halfdomelabs/baseplate/pull/844) [`06f5173`](https://github.com/halfdomelabs/baseplate/commit/06f517371c4904482873a4e30fe9b23b4fd2e36d) Thanks [@kingston](https://github.com/kingston)! - Improve better-auth feature parity with local-auth by adding password/email flows, admin mutations, frontend auth pages, seed user generator, and admin role. Also updates role flags, refines admin role handling, enhances auth UI, and adds project migration.

- [#850](https://github.com/halfdomelabs/baseplate/pull/850) [`71146cd`](https://github.com/halfdomelabs/baseplate/commit/71146cd1ab784f45e4409fef7e6e447750047e48) Thanks [@kingston](https://github.com/kingston)! - Add descriptions to app and package type options in the create new dialog so users understand what each type does before choosing

- [#866](https://github.com/halfdomelabs/baseplate/pull/866) [`5e182c3`](https://github.com/halfdomelabs/baseplate/commit/5e182c308c51b8d6f735b213ae12ba475c34dbd2) Thanks [@kingston](https://github.com/kingston)! - Detect and block disabling plugins whose types (transformers, package types, etc.) are still in use, showing a dialog listing the affected items

- [#864](https://github.com/halfdomelabs/baseplate/pull/864) [`0ba6744`](https://github.com/halfdomelabs/baseplate/commit/0ba67445708689622341f3031502b3308f71f68e) Thanks [@kingston](https://github.com/kingston)! - Support inline file category creation and editing from the file transformer form, eliminating the need to navigate to the plugin config page.

- [#851](https://github.com/halfdomelabs/baseplate/pull/851) [`53b8635`](https://github.com/halfdomelabs/baseplate/commit/53b86354ee6bc4b46d1966f657e3d6c942cf1eb1) Thanks [@kingston](https://github.com/kingston)! - Add plugin dependency support: plugins can declare `pluginDependencies` in plugin.json to require other plugins. Includes circular dependency detection via toposort, definition issue checking that blocks save for unmet dependencies, UI gating that prompts users to enable/configure dependencies before enabling a plugin, and implementation plugin validation. Added dependency declarations to local-auth (email, queue, rate-limit), email (queue), and storage (queue).

- [#839](https://github.com/halfdomelabs/baseplate/pull/839) [`85d957d`](https://github.com/halfdomelabs/baseplate/commit/85d957d4a2ab4b3a55a96c8dbba9a79d2f72511c) Thanks [@kingston](https://github.com/kingston)! - Support `exists()` and `all()` relation filter functions in authorization expressions for checking conditions on 1:many related records

- [#849](https://github.com/halfdomelabs/baseplate/pull/849) [`8d30c14`](https://github.com/halfdomelabs/baseplate/commit/8d30c145ce5d72dcfc038ff076ed0746d2d763cc) Thanks [@kingston](https://github.com/kingston)! - Change default relation onDelete from Cascade to Restrict

- [#856](https://github.com/halfdomelabs/baseplate/pull/856) [`ed5d250`](https://github.com/halfdomelabs/baseplate/commit/ed5d250146f0b48386a8208741150f9011892a35) Thanks [@kingston](https://github.com/kingston)! - Restrict certain app and library types to one instance per project by adding a singleton flag to type configurations.

- [#861](https://github.com/halfdomelabs/baseplate/pull/861) [`efcf233`](https://github.com/halfdomelabs/baseplate/commit/efcf2338c018ad46b08e8fef3994630dea511723) Thanks [@kingston](https://github.com/kingston)! - Sort entity arrays by name in project-definition.json for deterministic output. Entity schemas with `sortByName: true` in their `withEnt` annotation are sorted alphabetically during serialization.

- [#860](https://github.com/halfdomelabs/baseplate/pull/860) [`2a514a6`](https://github.com/halfdomelabs/baseplate/commit/2a514a63e741e1b16b3b1b168b84a60965141887) Thanks [@kingston](https://github.com/kingston)! - Support renames in reference expressions: when fields, relations, or roles are renamed, authorizer expressions are automatically updated to use the new names

- [#847](https://github.com/halfdomelabs/baseplate/pull/847) [`497904a`](https://github.com/halfdomelabs/baseplate/commit/497904a9b5088171f95c5e16bcda542fb5e98610) Thanks [@kingston](https://github.com/kingston)! - Connect theme builder UI to code generation. Theme color configuration from the project definition now drives the generated `styles.css` instead of hardcoded values. Default theme uses slate base with indigo primary. Remove explicit hover color variables (primaryHover, secondaryHover, destructiveHover) and linkVisited — hover is now computed via `color-mix` in CSS. Add palette swatch selection to theme color picker. Split preview into surface and interactive sections with input group and alert components.

- [#865](https://github.com/halfdomelabs/baseplate/pull/865) [`c7131f5`](https://github.com/halfdomelabs/baseplate/commit/c7131f5caebda203ece99d30fcf2d58ead3abdb8) Thanks [@kingston](https://github.com/kingston)! - Add schema migration 031 to convert `genUuid` boolean to `defaultGeneration` enum on UUID fields

- Updated dependencies [[`8dcf7b3`](https://github.com/halfdomelabs/baseplate/commit/8dcf7b3c909672487bad61b7a4465d1860092363), [`c24a24a`](https://github.com/halfdomelabs/baseplate/commit/c24a24ac9d2b66623acb0fda9c6ff2b3b80c0a6d), [`fc8f158`](https://github.com/halfdomelabs/baseplate/commit/fc8f1582f1702d2d6f6eaa60607da7bb777750b5), [`497904a`](https://github.com/halfdomelabs/baseplate/commit/497904a9b5088171f95c5e16bcda542fb5e98610)]:
  - @baseplate-dev/utils@0.6.5
  - @baseplate-dev/ui-components@0.6.5
  - @baseplate-dev/sync@0.6.5

## 0.6.4

### Patch Changes

- [#837](https://github.com/halfdomelabs/baseplate/pull/837) [`ba315aa`](https://github.com/halfdomelabs/baseplate/commit/ba315aaaec0e8842ec7fadb765b1fed5e3abda5a) Thanks [@kingston](https://github.com/kingston)! - Add `resolveFeatureName`, `createPartialFeatures`, and `getFeatureIdByNameOrThrow` to `FeatureUtils`.

- Updated dependencies [[`ba315aa`](https://github.com/halfdomelabs/baseplate/commit/ba315aaaec0e8842ec7fadb765b1fed5e3abda5a)]:
  - @baseplate-dev/ui-components@0.6.4
  - @baseplate-dev/sync@0.6.4
  - @baseplate-dev/utils@0.6.4

## 0.6.3

### Patch Changes

- [#835](https://github.com/halfdomelabs/baseplate/pull/835) [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931) Thanks [@kingston](https://github.com/kingston)! - Add support for indexes on tables, mirroring the existing unique constraints implementation

- [#835](https://github.com/halfdomelabs/baseplate/pull/835) [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931) Thanks [@kingston](https://github.com/kingston)! - Extract Sentry into standalone plugin package `@baseplate-dev/plugin-observability` and add migration to auto-enable Sentry plugin on existing projects

- [#835](https://github.com/halfdomelabs/baseplate/pull/835) [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931) Thanks [@kingston](https://github.com/kingston)! - Extract Stripe into standalone `@baseplate-dev/plugin-payments` package. Stripe is now managed through the plugin system instead of the `enableStripe` boolean on backend app config. Includes migration to automatically convert existing projects. Overhaul Stripe implementation to provide billing support.

- [#835](https://github.com/halfdomelabs/baseplate/pull/835) [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931) Thanks [@kingston](https://github.com/kingston)! - Support literal value comparisons in authorization expressions (e.g. `model.status === 'active'`, `model.isPublished !== false`)

- [#835](https://github.com/halfdomelabs/baseplate/pull/835) [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931) Thanks [@kingston](https://github.com/kingston)! - Fix entity navigation for discriminated union array children (e.g. admin sections) by stripping leading discriminated-union-array element from relative paths in collectEntityMetadata

- [#835](https://github.com/halfdomelabs/baseplate/pull/835) [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931) Thanks [@kingston](https://github.com/kingston)! - Add auto-fix suggestions for definition issues in the warning dialog, starting with relation field type mismatch fixes

- Updated dependencies [[`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931)]:
  - @baseplate-dev/ui-components@0.6.3
  - @baseplate-dev/sync@0.6.3
  - @baseplate-dev/utils@0.6.3

## 0.6.2

### Patch Changes

- Reset version to 0.6.2 to fix accidental major version bumps caused by missing changeset fixed-group configuration.

## 0.6.1

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/sync@0.6.1
  - @baseplate-dev/ui-components@0.6.1
  - @baseplate-dev/utils@0.6.1

## 0.6.0

### Patch Changes

- [#783](https://github.com/halfdomelabs/baseplate/pull/783) [`bd1095e`](https://github.com/halfdomelabs/baseplate/commit/bd1095e52dc3cecdb40bf84a906490a7c92fec40) Thanks [@kingston](https://github.com/kingston)! - Add offset pagination (skip/take) to list queries and optional count query generation

- [#802](https://github.com/halfdomelabs/baseplate/pull/802) [`801c706`](https://github.com/halfdomelabs/baseplate/commit/801c7066f7e943c026f03e71b8d39242036e0cad) Thanks [@kingston](https://github.com/kingston)! - Update prettier to ignore unchanged files in output

- [#786](https://github.com/halfdomelabs/baseplate/pull/786) [`3029d42`](https://github.com/halfdomelabs/baseplate/commit/3029d42f5d5967721f2b0d5892ea07a80c5f3a1f) Thanks [@kingston](https://github.com/kingston)! - Refactor entity type URL registration to use a plugin spec with a typed discriminated union navigation target system. Builders now register via `entityTypeUrlWebSpec.register(entityType, builder)` with params typed based on whether the entity has a parent — `parentId` and `parentKey` are required strings for child entity types and `undefined` for root entity types.

- [#795](https://github.com/halfdomelabs/baseplate/pull/795) [`dfa9638`](https://github.com/halfdomelabs/baseplate/commit/dfa963825c4ba847f9d21f4f014c4dd1722403d6) Thanks [@kingston](https://github.com/kingston)! - Integrate expression validation into the definition issue framework. Authorizer expression warnings (invalid field references, unknown roles, syntax errors) now surface as definition issues with warning severity.

- [#788](https://github.com/halfdomelabs/baseplate/pull/788) [`3b3be2b`](https://github.com/halfdomelabs/baseplate/commit/3b3be2b8d45b08552dca3d4e2b5ce391a958341b) Thanks [@kingston](https://github.com/kingston)! - Replace model-specific merger with generic schema-driven definition patcher

- [#779](https://github.com/halfdomelabs/baseplate/pull/779) [`eadad84`](https://github.com/halfdomelabs/baseplate/commit/eadad8494128ded2cbc76dfbe3b97f93769ea41f) Thanks [@kingston](https://github.com/kingston)! - Add global definition validation system with fixes, issue checkers, and bottom-up schema transformation
  - Introduce `withFix()` and `withIssueChecker()` schema decorators for registering fixes and issue checkers on Zod schema nodes
  - Add `transformDataWithSchema()` for bottom-up schema-guided data transformation with structural sharing
  - Refactor `applyDefinitionFixes` and `cleanDefaultValues` to use `transformDataWithSchema`
  - Add severity levels (`error`/`warning`) to definition issues; errors block save in the global save pipeline
  - Rename `walkSchemaWithData` to `walkDataWithSchema`

- [#802](https://github.com/halfdomelabs/baseplate/pull/802) [`801c706`](https://github.com/halfdomelabs/baseplate/commit/801c7066f7e943c026f03e71b8d39242036e0cad) Thanks [@kingston](https://github.com/kingston)! - Add `isAuthenticated` boolean to authorizer expression DSL and AuthContext. Warn when `hasRole('user')` is used, suggesting `isAuthenticated` instead.

- [#798](https://github.com/halfdomelabs/baseplate/pull/798) [`ee7ee0e`](https://github.com/halfdomelabs/baseplate/commit/ee7ee0e552090612190eb4446a52c30f4eefce6a) Thanks [@kingston](https://github.com/kingston)! - Add MCP actions for reading and writing project definition entities, including draft session support for staging changes before committing.

- [#802](https://github.com/halfdomelabs/baseplate/pull/802) [`801c706`](https://github.com/halfdomelabs/baseplate/commit/801c7066f7e943c026f03e71b8d39242036e0cad) Thanks [@kingston](https://github.com/kingston)! - Add nested authorizer expressions: `hasRole(model.relation, 'role')` and `hasSomeRole(model.relation, ['role1', 'role2'])` for checking roles on related model authorizers, with autocomplete and linter support.

- [#777](https://github.com/halfdomelabs/baseplate/pull/777) [`dc238be`](https://github.com/halfdomelabs/baseplate/commit/dc238be00158a528a60d9e6ef9cec32b2d8297be) Thanks [@kingston](https://github.com/kingston)! - Add per-field authorization support for GraphQL object type fields

- [#785](https://github.com/halfdomelabs/baseplate/pull/785) [`bd25ff0`](https://github.com/halfdomelabs/baseplate/commit/bd25ff08e71faeb97b560e7b349dba1967155704) Thanks [@kingston](https://github.com/kingston)! - Add `@baseplate-dev/project-builder-lib/testing` export

- [#796](https://github.com/halfdomelabs/baseplate/pull/796) [`8258b27`](https://github.com/halfdomelabs/baseplate/commit/8258b278e9a25a6e4bd5039a134238d071a63ecd) Thanks [@kingston](https://github.com/kingston)! - Add query filter code generation for instance-level authorization on GraphQL queries

- [#793](https://github.com/halfdomelabs/baseplate/pull/793) [`6e2675d`](https://github.com/halfdomelabs/baseplate/commit/6e2675d2166ac9bf470486efdc6a0e48df9bcc6d) Thanks [@kingston](https://github.com/kingston)! - Move mutation authorization from GraphQL-level to service-level, add compact grid-based role picker UI, filter system role from auth pickers, and hide disabled service methods from GraphQL mutations section

- [#789](https://github.com/halfdomelabs/baseplate/pull/789) [`2f860c5`](https://github.com/halfdomelabs/baseplate/commit/2f860c513a1caf95fdfd0729cf548990166f9a6f) Thanks [@kingston](https://github.com/kingston)! - Unify test and example project discovery under a single system:
  - Add `type: 'user' | 'example' | 'test'` and `baseplateDirectory` to `ProjectInfo`, replacing `isInternalExample`.
  - Add `baseplate.config.json` for deterministic project discovery — replaces `isExampleProject` heuristic and `EXCLUDE_EXAMPLES`/`PLUGIN_ROOT_DIRECTORIES` env vars.
  - Unify `discoverProjects` to accept structured options by project type — removes `discoverTestProjects` and duplicate `project-resolver.ts`.
  - Test projects live in `tests/<name>/` with output to `.output/` (gitignored).
  - Replace `test-project` subcommands with `baseplate-dev init <name> --type example|test` and `baseplate-dev run-env <test-name>`.

- [#775](https://github.com/halfdomelabs/baseplate/pull/775) [`78315cc`](https://github.com/halfdomelabs/baseplate/commit/78315ccd9b0b0330cd2d08584c6d5ec516d641e3) Thanks [@kingston](https://github.com/kingston)! - Upgrade Sentry to v10, react-hook-form, and es-toolkit
  - @sentry/react: 9.17.0 → 10.39.0
  - @sentry/core: 9.17.0 → 10.39.0
  - @sentry/node: 9.17.0 → 10.39.0
  - @sentry/profiling-node: 9.17.0 → 10.39.0
  - @pothos/tracing-sentry: 1.1.1 → 1.1.4
  - react-hook-form: 7.60.0 → 7.71.1
  - es-toolkit: 1.31.0 → 1.44.0

- [#785](https://github.com/halfdomelabs/baseplate/pull/785) [`bd25ff0`](https://github.com/halfdomelabs/baseplate/commit/bd25ff08e71faeb97b560e7b349dba1967155704) Thanks [@kingston](https://github.com/kingston)! - Remove redundant `.optional()` wrapper from `withDefault`

  `withDefault` previously wrapped the schema in both `.prefault()` and `.optional()`. Since `.prefault()` already makes fields accept absent/undefined input, the `.optional()` was redundant and caused the output type to incorrectly include `| undefined` for defaulted fields.

- Updated dependencies [[`ee7ee0e`](https://github.com/halfdomelabs/baseplate/commit/ee7ee0e552090612190eb4446a52c30f4eefce6a), [`801c706`](https://github.com/halfdomelabs/baseplate/commit/801c7066f7e943c026f03e71b8d39242036e0cad), [`3b3be2b`](https://github.com/halfdomelabs/baseplate/commit/3b3be2b8d45b08552dca3d4e2b5ce391a958341b), [`cad5352`](https://github.com/halfdomelabs/baseplate/commit/cad535239b47080e30f894383cc330e37213a76c), [`cad5352`](https://github.com/halfdomelabs/baseplate/commit/cad535239b47080e30f894383cc330e37213a76c)]:
  - @baseplate-dev/utils@0.6.0
  - @baseplate-dev/ui-components@0.6.0
  - @baseplate-dev/sync@0.6.0

## 0.5.3

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/sync@0.5.3
  - @baseplate-dev/ui-components@0.5.3
  - @baseplate-dev/utils@0.5.3

## 0.5.2

### Patch Changes

- [#761](https://github.com/halfdomelabs/baseplate/pull/761) [`b4db947`](https://github.com/halfdomelabs/baseplate/commit/b4db947f256c4b8639d7f18ffb58bb2b1646c497) Thanks [@kingston](https://github.com/kingston)! - Add configurable development ports for apps with automatic assignment and conflict validation

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

- Updated dependencies [[`02740a6`](https://github.com/halfdomelabs/baseplate/commit/02740a6e230c7fbf28fc768543353e847671c51b), [`dd40bcd`](https://github.com/halfdomelabs/baseplate/commit/dd40bcd219c79f0cd7b66c0427c77deda0664072)]:
  - @baseplate-dev/ui-components@0.5.2
  - @baseplate-dev/sync@0.5.2
  - @baseplate-dev/utils@0.5.2

## 0.5.1

### Patch Changes

- [#737](https://github.com/halfdomelabs/baseplate/pull/737) [`55aa484`](https://github.com/halfdomelabs/baseplate/commit/55aa484621f2dc5b1195b6b537e7d6ad215bc499) Thanks [@kingston](https://github.com/kingston)! - Refactor plugin spec system with lazy initialization and clear setup/use phases

  This refactoring overhauls the plugin spec system to introduce a two-phase architecture with lazy initialization:

  **New Architecture:**
  - **Setup phase (init)**: Plugins register their implementations during module initialization using mutable field containers
  - **Use phase**: Consumers access registered items through a read-only interface, with lazy initialization on first access
  - **FieldMap-based specs**: New `createFieldMapSpec` helper provides type-safe containers (maps, arrays, named arrays, scalars) with automatic source tracking

  **Key changes:**
  - Rename `PluginImplementationStore` to `PluginSpecStore` with cached `use()` instances
  - Rename `createPlatformPluginExport` to `createPluginModule`
  - Add required `name` field to all plugin modules for unique identification
  - Convert all specs to use `createFieldMapSpec` with typed containers
  - Update all plugin modules to use new registration methods (`.add()`, `.set()`, `.push()`)
  - Introduce `ModuleContext` with `moduleKey` and `pluginKey` for better source tracking
  - Specs now define both `init` (mutable setup interface) and `use` (read-only consumption interface)

- [#740](https://github.com/halfdomelabs/baseplate/pull/740) [`2de5d5c`](https://github.com/halfdomelabs/baseplate/commit/2de5d5c43c5354571d50707a99b4028ff8792534) Thanks [@kingston](https://github.com/kingston)! - Rename `packages` to `libraries` in project definition schema
  - Renamed `packages` field to `libraries` in project definition
  - Renamed `packagesFolder` to `librariesFolder` in monorepo settings with new default `libs`
  - Updated entity IDs from `package:*` prefix to `library:*`
  - Added migration (022) to automatically migrate existing projects
  - Reorganized routes from `/apps/*` to `/packages/*` root with `/packages/apps/$key` and `/packages/libs/$key` subroutes

  **Breaking change:** The default library folder has changed from `packages` to `libs`. If you have existing library packages, you will need to rename your `packages/` directory to `libs/` in your project.

- Updated dependencies []:
  - @baseplate-dev/sync@0.5.1
  - @baseplate-dev/ui-components@0.5.1
  - @baseplate-dev/utils@0.5.1

## 0.5.0

### Patch Changes

- [#731](https://github.com/halfdomelabs/baseplate/pull/731) [`97bd14e`](https://github.com/halfdomelabs/baseplate/commit/97bd14e381206b54e55c22264d1d406e83146146) Thanks [@kingston](https://github.com/kingston)! - Add support for library packages in addition to apps
  - Add `packages` array to ProjectDefinition schema with node-library type
  - Add `packagesFolder` to MonorepoSettings (default: "packages")
  - Create node-library generator with tsc build configuration
  - Add library package compiler for code generation
  - Update workspace patterns to include packages/\* folder
  - Add UI for creating and managing library packages in the Apps section

- Updated dependencies [[`c7d373e`](https://github.com/halfdomelabs/baseplate/commit/c7d373ebaaeda2522515fdaeae0d37d0cd9ce7fe), [`8bfc742`](https://github.com/halfdomelabs/baseplate/commit/8bfc742b8a93393a5539babfd11b97a88ee9c39e)]:
  - @baseplate-dev/sync@0.5.0
  - @baseplate-dev/ui-components@0.5.0
  - @baseplate-dev/utils@0.5.0

## 0.4.4

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/sync@0.4.4
  - @baseplate-dev/ui-components@0.4.4
  - @baseplate-dev/utils@0.4.4

## 0.4.3

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/sync@0.4.3
  - @baseplate-dev/ui-components@0.4.3
  - @baseplate-dev/utils@0.4.3

## 0.4.2

### Patch Changes

- [#711](https://github.com/halfdomelabs/baseplate/pull/711) [`bde61e3`](https://github.com/halfdomelabs/baseplate/commit/bde61e3e5dfc4d6d19c0d2a71491de4605cd2c20) Thanks [@kingston](https://github.com/kingston)! - Add BullMQ plugin as managed child of queue plugin
  - Create new BullMQ plugin (`@baseplate-dev/plugin-queue/bullmq`) following the pg-boss plugin pattern
  - Add migration (021) to migrate `enableBullQueue` from backend app config to queue/bullmq plugin config
  - Remove old `bullMqGenerator` and `fastifyBullBoardGenerator` from fastify-generators
  - Remove Bull Board integration (to be replaced with local alternative in the future)
  - Remove `enableBullQueue` option from backend app schema and UI

- [#709](https://github.com/halfdomelabs/baseplate/pull/709) [`6828918`](https://github.com/halfdomelabs/baseplate/commit/6828918121bb244fdc84758d28a87370cbc70992) Thanks [@kingston](https://github.com/kingston)! - Fix plugin config migration version not being set correctly when enabling a new plugin via web config editor

- [#697](https://github.com/halfdomelabs/baseplate/pull/697) [`11fa86f`](https://github.com/halfdomelabs/baseplate/commit/11fa86fb8e7a209175f132b1b3d59cd24cf13d54) Thanks [@kingston](https://github.com/kingston)! - Ignore \*.map files from built output in package.json

- [#702](https://github.com/halfdomelabs/baseplate/pull/702) [`18c7cf1`](https://github.com/halfdomelabs/baseplate/commit/18c7cf19c0d171b734eb9bcc53320ccf02baa08a) Thanks [@kingston](https://github.com/kingston)! - Refactor reference extraction to use functional approach with `refContext` and `provides` instead of `withRefBuilder`

- Updated dependencies [[`795ee4c`](https://github.com/halfdomelabs/baseplate/commit/795ee4c18e7b393fb9247ced23a12de5e219ab15), [`11fa86f`](https://github.com/halfdomelabs/baseplate/commit/11fa86fb8e7a209175f132b1b3d59cd24cf13d54), [`4be6c7d`](https://github.com/halfdomelabs/baseplate/commit/4be6c7dc7d900c37585b93cf5bb7198de6a41f1f), [`a173074`](https://github.com/halfdomelabs/baseplate/commit/a1730748bbbc21ea22d9d91bf28e34d2c351425b)]:
  - @baseplate-dev/sync@0.4.2
  - @baseplate-dev/ui-components@0.4.2
  - @baseplate-dev/utils@0.4.2

## 0.4.1

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/sync@0.4.1
  - @baseplate-dev/ui-components@0.4.1
  - @baseplate-dev/utils@0.4.1

## 0.4.0

### Minor Changes

- [#684](https://github.com/halfdomelabs/baseplate/pull/684) [`9f22eef`](https://github.com/halfdomelabs/baseplate/commit/9f22eef139c8db2dde679f6424eb23e024e37d19) Thanks [@kingston](https://github.com/kingston)! - BREAKING: Remove `packageLocation` field and standardize app locations to `apps/{appName}`

  The `packageLocation` field has been removed from app configurations. All apps now use a standardized location pattern: `apps/{appName}`.

  **Migration required for existing projects:**
  1. Move your app folders from `packages/` to `apps/`
  2. Update `pnpm-workspace.yaml` to use `apps/*` instead of `packages/*`

- [#687](https://github.com/halfdomelabs/baseplate/pull/687) [`57e15c0`](https://github.com/halfdomelabs/baseplate/commit/57e15c085099508898756385661df9cf54108466) Thanks [@kingston](https://github.com/kingston)! - Add support for generating the root of a monorepo

### Patch Changes

- [#690](https://github.com/halfdomelabs/baseplate/pull/690) [`839cbdf`](https://github.com/halfdomelabs/baseplate/commit/839cbdfc6ddc059aa86d24bf6ec5d8e95cce9042) Thanks [@kingston](https://github.com/kingston)! - Move Docker Compose generation from backend to root package

  Docker Compose configuration is now generated at the monorepo root instead of within individual backend packages. This provides a better developer experience with a single `docker compose up` command from the project root.

  **Breaking Changes:**
  - Docker files now generate at `docker/` (root) instead of `apps/backend/docker/`
  - `enableRedis` removed from backend app configuration - moved to project-level infrastructure settings
  - New Infrastructure settings page for configuring Redis (Postgres is always enabled)

- [#690](https://github.com/halfdomelabs/baseplate/pull/690) [`839cbdf`](https://github.com/halfdomelabs/baseplate/commit/839cbdfc6ddc059aa86d24bf6ec5d8e95cce9042) Thanks [@kingston](https://github.com/kingston)! - Add migration to move enableRedis from backend apps to infrastructure settings. Redis configuration is now stored at settings.infrastructure.redis.enabled instead of individual backend app settings, allowing for centralized infrastructure configuration across the monorepo.

- Updated dependencies [[`839cbdf`](https://github.com/halfdomelabs/baseplate/commit/839cbdfc6ddc059aa86d24bf6ec5d8e95cce9042), [`c3c2a00`](https://github.com/halfdomelabs/baseplate/commit/c3c2a001d57a21f76e064af55941a43bedf26f18), [`d324059`](https://github.com/halfdomelabs/baseplate/commit/d3240594e1c2bc2348eb1a7e8938f97ea5f55d22)]:
  - @baseplate-dev/sync@0.4.0
  - @baseplate-dev/utils@0.4.0
  - @baseplate-dev/ui-components@0.4.0

## 0.3.8

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/sync@0.3.8
  - @baseplate-dev/ui-components@0.3.8
  - @baseplate-dev/utils@0.3.8

## 0.3.7

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/sync@0.3.7
  - @baseplate-dev/ui-components@0.3.7
  - @baseplate-dev/utils@0.3.7

## 0.3.6

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/sync@0.3.6
  - @baseplate-dev/ui-components@0.3.6
  - @baseplate-dev/utils@0.3.6

## 0.3.5

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/sync@0.3.5
  - @baseplate-dev/ui-components@0.3.5
  - @baseplate-dev/utils@0.3.5

## 0.3.4

### Patch Changes

- [#638](https://github.com/halfdomelabs/baseplate/pull/638) [`f450b7f`](https://github.com/halfdomelabs/baseplate/commit/f450b7f75cf5ad71c2bdb1c077526251aa240dd0) Thanks [@kingston](https://github.com/kingston)! - Standardize data model names across auth and storage plugins

  This change removes the ability for users to configure custom model names, replacing it with standardized, fixed model names extracted to plugin-specific constants files. This simplifies templates by eliminating parameterization and makes it easier to discover what models are used by each plugin.

  **Breaking Changes:**
  - Removed `modelRefs` configuration from plugin schemas
  - Model names are now fixed: User, UserAccount, UserRole, UserSession (auth), File (storage)

  **Improvements:**
  - Added plugin-specific constants files for better discoverability
  - Simplified UI by removing model selection components
  - Enhanced ModelMergerResultAlert to show "Models Up to Date" instead of null when no changes needed
  - Maintained type safety with Record types

  **Migration:**
  - Remove any `modelRefs` configuration from plugin definitions
  - Model names will be automatically standardized to the new constants

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
  - @baseplate-dev/utils@0.3.4
  - @baseplate-dev/ui-components@0.3.4

## 0.3.3

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/sync@0.3.3
  - @baseplate-dev/ui-components@0.3.3
  - @baseplate-dev/utils@0.3.3

## 0.3.2

### Patch Changes

- [#633](https://github.com/halfdomelabs/baseplate/pull/633) [`cca138a`](https://github.com/halfdomelabs/baseplate/commit/cca138a84abbb901ab628bf571ae29211a180dbb) Thanks [@kingston](https://github.com/kingston)! - Add admin CRUD action specification system

  Adds a new plugin specification system that allows plugins to register custom table actions for admin CRUD sections. This provides the foundation for plugins to contribute actions like "Manage Roles" to generated admin tables.
  - Created `AdminCrudActionSpec` plugin specification
  - Added base action types and schemas for registration
  - Implemented built-in edit and delete action types
  - Extended admin CRUD section schema to include optional actions array
  - Provides type-safe action registration with authorization and model targeting support

- Updated dependencies []:
  - @baseplate-dev/sync@0.3.2
  - @baseplate-dev/ui-components@0.3.2
  - @baseplate-dev/utils@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/sync@0.3.1
  - @baseplate-dev/ui-components@0.3.1
  - @baseplate-dev/utils@0.3.1

## 0.3.0

### Minor Changes

- [#622](https://github.com/halfdomelabs/baseplate/pull/622) [`85e6413`](https://github.com/halfdomelabs/baseplate/commit/85e6413f8e3ad0043daca3bb9fa3ca5a27843a65) Thanks [@kingston](https://github.com/kingston)! - This major refactor splits the monolithic auth plugin into a managed plugin architecture:

  ## Plugin Structure Changes
  - **Base auth plugin** (`auth`): Manages common functionality, roles, and provider selection
  - **Implementation plugins** (managed):
    - `local-auth`: Email/password authentication (renamed from original `auth` plugin)
    - `auth0`: Auth0 integration
    - `placeholder-auth`: Development/testing placeholder

  ## Key Changes

  ### Plugin Metadata System
  - **BREAKING**: Replace `manifest.json` with `plugin.json` for all plugins
  - **BREAKING**: Rename `id` to `key` in plugin metadata for URL consistency
  - Add `managedBy` field to plugin metadata for managed plugin relationships
  - Implement package.json-based plugin discovery configuration

  ### Managed Plugin Pattern
  - Implementation plugins are hidden from main plugin list
  - Base plugin automatically manages lifecycle of implementation plugins
  - UI shows "Managed Plugins" section grouped by manager
  - Configure buttons on managed plugins redirect to manager's config page

  ### Configuration Schema
  - Base auth plugin config includes `implementationPluginKey` to specify active provider
  - Roles configuration moved to base plugin (shared across implementations)
  - Provider-specific configs remain in implementation plugins

  ### UI Improvements
  - Add tabbed navigation (`AuthConfigTabs`) across all auth plugin interfaces
  - Dynamic provider selection within base plugin configuration
  - Consistent UX patterns between all auth implementation plugins

  ### Migration Support
  - Automatic migration of existing `plugin-auth` configs to new structure
  - Rename existing `plugin-auth_auth` to `plugin-auth_local-auth`
  - Auto-enable base auth plugin when implementation plugins are detected
  - Preserve all existing configuration without code changes needed

### Patch Changes

- Updated dependencies [[`aaf8634`](https://github.com/halfdomelabs/baseplate/commit/aaf8634abcf76d938072c7afc43e6e99a2519b13), [`687a47e`](https://github.com/halfdomelabs/baseplate/commit/687a47e5e39abc5138ba3fc2d0db9cfee6e4dbfe)]:
  - @baseplate-dev/ui-components@0.3.0
  - @baseplate-dev/sync@0.3.0
  - @baseplate-dev/utils@0.3.0

## 0.2.6

### Patch Changes

- [#615](https://github.com/halfdomelabs/baseplate/pull/615) [`e639251`](https://github.com/halfdomelabs/baseplate/commit/e639251f25094bb17f126e8604e505b1037b5640) Thanks [@kingston](https://github.com/kingston)! - Fix model merger not being able to create new models from scratch

- [#617](https://github.com/halfdomelabs/baseplate/pull/617) [`cc6cd6c`](https://github.com/halfdomelabs/baseplate/commit/cc6cd6cce6bd0d97a68d7bd5b46408e0877d990b) Thanks [@kingston](https://github.com/kingston)! - Add schema migration for web admin configuration support. This migration converts existing admin apps to web apps with adminConfig enabled, and adds the adminConfig field to existing web apps. This enables backward compatibility when upgrading projects to the unified web admin interface.

- Updated dependencies [[`541db59`](https://github.com/halfdomelabs/baseplate/commit/541db59ccf868b6a6fcc8fa756eab0dfa560d193)]:
  - @baseplate-dev/ui-components@0.2.6
  - @baseplate-dev/sync@0.2.6
  - @baseplate-dev/utils@0.2.6

## 0.2.5

### Patch Changes

- [#608](https://github.com/halfdomelabs/baseplate/pull/608) [`01c47c7`](https://github.com/halfdomelabs/baseplate/commit/01c47c77f039a463de03271de6461cd969d5a8e8) Thanks [@kingston](https://github.com/kingston)! - Refactor plugin migration system to separate config and project definition changes

  Previously, plugin migrations had mixed responsibilities - both transforming plugin config and mutating the project definition in the same unclear contract. This made the system hard to test and reason about.

  **New Migration Interface:**
  - `PluginMigrationResult` with explicit `updatedConfig` and `updateProjectDefinition` properties
  - Clear separation between config transformations and project definition updates
  - Better type safety and testability

  **Schema Version Bug Fix:**
  - Fixed bug where enabling plugins via UI didn't set `configSchemaVersion`
  - Plugin card now uses `PluginUtils.setPluginConfig` to automatically set correct schema version
  - Prevents unnecessary migrations when enabling new plugins

  **Migration Updates:**
  - All existing migrations updated to use new interface
  - Auth plugin migration: simple config-only transformation
  - Storage plugin migrations: migration #1 (config-only), migration #2 (config + project updates)

- Updated dependencies [[`e0d690c`](https://github.com/halfdomelabs/baseplate/commit/e0d690c1e139f93a8ff60c9e0c90bc72cdf705a4)]:
  - @baseplate-dev/sync@0.2.5
  - @baseplate-dev/ui-components@0.2.5
  - @baseplate-dev/utils@0.2.5

## 0.2.4

### Patch Changes

- Updated dependencies [[`ffe791f`](https://github.com/halfdomelabs/baseplate/commit/ffe791f6ab44e82c8481f3a18df9262dec71cff6)]:
  - @baseplate-dev/utils@0.2.4
  - @baseplate-dev/sync@0.2.4
  - @baseplate-dev/ui-components@0.2.4

## 0.2.3

### Patch Changes

- Updated dependencies [[`a506e88`](https://github.com/halfdomelabs/baseplate/commit/a506e88893bf395916ef3fbf6dd9dd7c0ff17acb), [`903e2d8`](https://github.com/halfdomelabs/baseplate/commit/903e2d898c47e6559f55f023eb89a0b524098f3a), [`a506e88`](https://github.com/halfdomelabs/baseplate/commit/a506e88893bf395916ef3fbf6dd9dd7c0ff17acb), [`059edf7`](https://github.com/halfdomelabs/baseplate/commit/059edf771755f1ff846494f238d777a9d1f7f5d7), [`059edf7`](https://github.com/halfdomelabs/baseplate/commit/059edf771755f1ff846494f238d777a9d1f7f5d7), [`de9e1b4`](https://github.com/halfdomelabs/baseplate/commit/de9e1b4f3a8a7dcf6b962781a0aa589eb970c7a8)]:
  - @baseplate-dev/sync@0.2.3
  - @baseplate-dev/ui-components@0.2.3
  - @baseplate-dev/utils@0.2.3

## 0.2.2

### Patch Changes

- [#587](https://github.com/halfdomelabs/baseplate/pull/587) [`b6bc11f`](https://github.com/halfdomelabs/baseplate/commit/b6bc11fdf199c8de40832eb88ea6f6cfc83aa5d7) Thanks [@kingston](https://github.com/kingston)! - Migrate reference system from ZodRef to transform-based architecture
  - Complete migration from legacy ZodRef system to new transform-based reference processing using marker classes and schema transformations
  - Implement `deserializeSchemaWithTransformedReferences` for integration testing with real-world usage patterns
  - Replace `fixRefDeletions` implementation to use new transform system with `parseSchemaWithTransformedReferences`
  - Add comprehensive test coverage using integration tests with `deserializeSchemaWithTransformedReferences` instead of manual marker creation
  - Support for complex reference scenarios including nested references, parent-child relationships, and custom name resolvers
  - Rename `SET_NULL` to `SET_UNDEFINED` and add array context detection to prevent JSON serialization issues
  - Add omit pattern support to `useEnumForm` hook for consistency with `useModelForm`

- Updated dependencies [[`f8c9284`](https://github.com/halfdomelabs/baseplate/commit/f8c9284752c12c6aab70481bf98e6fa402e61075), [`f8c9284`](https://github.com/halfdomelabs/baseplate/commit/f8c9284752c12c6aab70481bf98e6fa402e61075)]:
  - @baseplate-dev/utils@0.2.2
  - @baseplate-dev/sync@0.2.2
  - @baseplate-dev/ui-components@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies [[`4d7677e`](https://github.com/halfdomelabs/baseplate/commit/4d7677e8ef2da8ed045ee7fe409519f0f124b34c)]:
  - @baseplate-dev/ui-components@0.2.1
  - @baseplate-dev/sync@0.2.1
  - @baseplate-dev/utils@0.2.1

## 0.2.0

### Patch Changes

- [#568](https://github.com/halfdomelabs/baseplate/pull/568) [`06b4faf`](https://github.com/halfdomelabs/baseplate/commit/06b4fafaf3d2ed848d959a9911b9bfa26702d4a3) Thanks [@kingston](https://github.com/kingston)! - Enable the import-x/consistent-type-specifier-style rule to clean up type imports

- [#576](https://github.com/halfdomelabs/baseplate/pull/576) [`fd63554`](https://github.com/halfdomelabs/baseplate/commit/fd635544eb6df0385501f61f3e51bce554633458) Thanks [@kingston](https://github.com/kingston)! - Rename entity UID to Key to make it clearer what is happening

- Updated dependencies [[`06b4faf`](https://github.com/halfdomelabs/baseplate/commit/06b4fafaf3d2ed848d959a9911b9bfa26702d4a3), [`3198895`](https://github.com/halfdomelabs/baseplate/commit/3198895bc45f6ff031e3d1e2c8554ddc3a30261d), [`f5d7a6f`](https://github.com/halfdomelabs/baseplate/commit/f5d7a6f781b1799bb8ad197973e5cec04f869264), [`fd63554`](https://github.com/halfdomelabs/baseplate/commit/fd635544eb6df0385501f61f3e51bce554633458), [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13), [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9), [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13), [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9)]:
  - @baseplate-dev/ui-components@0.2.0
  - @baseplate-dev/utils@0.2.0
  - @baseplate-dev/sync@0.2.0

## 0.1.3

### Patch Changes

- [#564](https://github.com/halfdomelabs/baseplate/pull/564) [`8631cfe`](https://github.com/halfdomelabs/baseplate/commit/8631cfec32f1e5286d6d1ab0eb0e858461672545) Thanks [@kingston](https://github.com/kingston)! - Add support for model merging the GraphQL object type

- [#562](https://github.com/halfdomelabs/baseplate/pull/562) [`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad) Thanks [@kingston](https://github.com/kingston)! - Switch to Typescript project references for building/watching project

- Updated dependencies [[`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad)]:
  - @baseplate-dev/ui-components@0.1.3
  - @baseplate-dev/utils@0.1.3
  - @baseplate-dev/sync@0.1.3

## 0.1.2

### Patch Changes

- [#560](https://github.com/halfdomelabs/baseplate/pull/560) [`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8) Thanks [@kingston](https://github.com/kingston)! - Add README files to all packages and plugins explaining their purpose within the Baseplate monorepo.

- Updated dependencies [[`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8)]:
  - @baseplate-dev/ui-components@0.1.2
  - @baseplate-dev/sync@0.1.2
  - @baseplate-dev/utils@0.1.2

## 0.1.1

### Patch Changes

- [#559](https://github.com/halfdomelabs/baseplate/pull/559) [`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b) Thanks [@kingston](https://github.com/kingston)! - Rename workspace to @baseplate-dev/\* and reset versions to 0.1.0

- [#557](https://github.com/halfdomelabs/baseplate/pull/557) [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad) Thanks [@kingston](https://github.com/kingston)! - Update LICENSE to modified MPL-2.0 license

- Updated dependencies [[`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b), [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad)]:
  - @baseplate-dev/ui-components@0.1.1
  - @baseplate-dev/utils@0.1.1
  - @baseplate-dev/sync@0.1.1
