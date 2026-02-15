# @baseplate-dev/project-builder-web

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

- Updated dependencies [[`b4db947`](https://github.com/halfdomelabs/baseplate/commit/b4db947f256c4b8639d7f18ffb58bb2b1646c497), [`02740a6`](https://github.com/halfdomelabs/baseplate/commit/02740a6e230c7fbf28fc768543353e847671c51b), [`dd40bcd`](https://github.com/halfdomelabs/baseplate/commit/dd40bcd219c79f0cd7b66c0427c77deda0664072)]:
  - @baseplate-dev/project-builder-lib@0.5.2
  - @baseplate-dev/ui-components@0.5.2
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

- Updated dependencies [[`55aa484`](https://github.com/halfdomelabs/baseplate/commit/55aa484621f2dc5b1195b6b537e7d6ad215bc499), [`2de5d5c`](https://github.com/halfdomelabs/baseplate/commit/2de5d5c43c5354571d50707a99b4028ff8792534)]:
  - @baseplate-dev/project-builder-lib@0.5.1
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

- Updated dependencies [[`97bd14e`](https://github.com/halfdomelabs/baseplate/commit/97bd14e381206b54e55c22264d1d406e83146146)]:
  - @baseplate-dev/project-builder-lib@0.5.0
  - @baseplate-dev/ui-components@0.5.0
  - @baseplate-dev/utils@0.5.0

## 0.4.4

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/project-builder-lib@0.4.4
  - @baseplate-dev/ui-components@0.4.4
  - @baseplate-dev/utils@0.4.4

## 0.4.3

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/project-builder-lib@0.4.3
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

- [#697](https://github.com/halfdomelabs/baseplate/pull/697) [`11fa86f`](https://github.com/halfdomelabs/baseplate/commit/11fa86fb8e7a209175f132b1b3d59cd24cf13d54) Thanks [@kingston](https://github.com/kingston)! - Ignore \*.map files from built output in package.json

- [#705](https://github.com/halfdomelabs/baseplate/pull/705) [`a173074`](https://github.com/halfdomelabs/baseplate/commit/a1730748bbbc21ea22d9d91bf28e34d2c351425b) Thanks [@kingston](https://github.com/kingston)! - Upgrade dependencies:
  - Storybook 9.0.18 → 10.1.10
  - TRPC 11.7.2 → 11.8.0
  - MCP SDK 1.23.0 → 1.25.1
  - eslint-plugin-storybook 9.0.18 → 10.1.10
- Updated dependencies [[`bde61e3`](https://github.com/halfdomelabs/baseplate/commit/bde61e3e5dfc4d6d19c0d2a71491de4605cd2c20), [`6828918`](https://github.com/halfdomelabs/baseplate/commit/6828918121bb244fdc84758d28a87370cbc70992), [`11fa86f`](https://github.com/halfdomelabs/baseplate/commit/11fa86fb8e7a209175f132b1b3d59cd24cf13d54), [`4be6c7d`](https://github.com/halfdomelabs/baseplate/commit/4be6c7dc7d900c37585b93cf5bb7198de6a41f1f), [`18c7cf1`](https://github.com/halfdomelabs/baseplate/commit/18c7cf19c0d171b734eb9bcc53320ccf02baa08a), [`a173074`](https://github.com/halfdomelabs/baseplate/commit/a1730748bbbc21ea22d9d91bf28e34d2c351425b)]:
  - @baseplate-dev/project-builder-lib@0.4.2
  - @baseplate-dev/ui-components@0.4.2
  - @baseplate-dev/utils@0.4.2

## 0.4.1

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/project-builder-lib@0.4.1
  - @baseplate-dev/ui-components@0.4.1
  - @baseplate-dev/utils@0.4.1

## 0.4.0

### Minor Changes

- [#687](https://github.com/halfdomelabs/baseplate/pull/687) [`57e15c0`](https://github.com/halfdomelabs/baseplate/commit/57e15c085099508898756385661df9cf54108466) Thanks [@kingston](https://github.com/kingston)! - Add support for generating the root of a monorepo

### Patch Changes

- [#690](https://github.com/halfdomelabs/baseplate/pull/690) [`839cbdf`](https://github.com/halfdomelabs/baseplate/commit/839cbdfc6ddc059aa86d24bf6ec5d8e95cce9042) Thanks [@kingston](https://github.com/kingston)! - Move Docker Compose generation from backend to root package

  Docker Compose configuration is now generated at the monorepo root instead of within individual backend packages. This provides a better developer experience with a single `docker compose up` command from the project root.

  **Breaking Changes:**
  - Docker files now generate at `docker/` (root) instead of `apps/backend/docker/`
  - `enableRedis` removed from backend app configuration - moved to project-level infrastructure settings
  - New Infrastructure settings page for configuring Redis (Postgres is always enabled)

- Updated dependencies [[`9f22eef`](https://github.com/halfdomelabs/baseplate/commit/9f22eef139c8db2dde679f6424eb23e024e37d19), [`839cbdf`](https://github.com/halfdomelabs/baseplate/commit/839cbdfc6ddc059aa86d24bf6ec5d8e95cce9042), [`839cbdf`](https://github.com/halfdomelabs/baseplate/commit/839cbdfc6ddc059aa86d24bf6ec5d8e95cce9042), [`c3c2a00`](https://github.com/halfdomelabs/baseplate/commit/c3c2a001d57a21f76e064af55941a43bedf26f18), [`d324059`](https://github.com/halfdomelabs/baseplate/commit/d3240594e1c2bc2348eb1a7e8938f97ea5f55d22), [`57e15c0`](https://github.com/halfdomelabs/baseplate/commit/57e15c085099508898756385661df9cf54108466)]:
  - @baseplate-dev/project-builder-lib@0.4.0
  - @baseplate-dev/utils@0.4.0
  - @baseplate-dev/ui-components@0.4.0

## 0.3.8

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/project-builder-lib@0.3.8
  - @baseplate-dev/ui-components@0.3.8
  - @baseplate-dev/utils@0.3.8

## 0.3.7

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/project-builder-lib@0.3.7
  - @baseplate-dev/ui-components@0.3.7
  - @baseplate-dev/utils@0.3.7

## 0.3.6

### Patch Changes

- [#659](https://github.com/halfdomelabs/baseplate/pull/659) [`2bb3f43`](https://github.com/halfdomelabs/baseplate/commit/2bb3f43051a96ded9ff4918e16e48eb434f48d75) Thanks [@kingston](https://github.com/kingston)! - Allow services with transformers but no exposed service functions

- Updated dependencies []:
  - @baseplate-dev/project-builder-lib@0.3.6
  - @baseplate-dev/ui-components@0.3.6
  - @baseplate-dev/utils@0.3.6

## 0.3.5

### Patch Changes

- [#658](https://github.com/halfdomelabs/baseplate/pull/658) [`fe86213`](https://github.com/halfdomelabs/baseplate/commit/fe86213911e935f2f34ffd9b2b3a39b1b3194aad) Thanks [@kingston](https://github.com/kingston)! - Update admin dialogs to reset when a new field is added

- Updated dependencies []:
  - @baseplate-dev/project-builder-lib@0.3.5
  - @baseplate-dev/ui-components@0.3.5
  - @baseplate-dev/utils@0.3.5

## 0.3.4

### Patch Changes

- [#650](https://github.com/halfdomelabs/baseplate/pull/650) [`783a495`](https://github.com/halfdomelabs/baseplate/commit/783a495411e76d28b781bbe0af5f57300a282353) Thanks [@kingston](https://github.com/kingston)! - Add PORT_OFFSET support for parallel development environments
  - Added PORT_OFFSET environment variable to run multiple dev container instances
  - Changed default ports to safer, more memorable ranges (4300, 4400, 4500)
  - Server, web, and dev server ports now respect PORT_OFFSET from root .env file
  - Each instance can run on predictable, non-conflicting ports
  - Created helper script for setting up parallel environments with different offsets

- [#643](https://github.com/halfdomelabs/baseplate/pull/643) [`7d9e6d0`](https://github.com/halfdomelabs/baseplate/commit/7d9e6d01e0a9920cee4c4d499beeffc1c663494a) Thanks [@kingston](https://github.com/kingston)! - Upgrade to TypeScript 5.8 with erasable syntax only mode

  This upgrade modernizes the codebase with TypeScript 5.8, enables erasable syntax only mode for better performance, and updates runtime dependencies.

  **Key Changes:**
  - Upgraded TypeScript to version 5.8
  - Enabled `erasableSyntaxOnly` compiler option for improved build performance
  - Updated Node.js requirement to 22.18
  - Updated PNPM requirement to 10.15
  - Fixed parameter property syntax to be compatible with erasable syntax only mode

- Updated dependencies [[`f450b7f`](https://github.com/halfdomelabs/baseplate/commit/f450b7f75cf5ad71c2bdb1c077526251aa240dd0), [`7d9e6d0`](https://github.com/halfdomelabs/baseplate/commit/7d9e6d01e0a9920cee4c4d499beeffc1c663494a)]:
  - @baseplate-dev/project-builder-lib@0.3.4
  - @baseplate-dev/utils@0.3.4
  - @baseplate-dev/ui-components@0.3.4

## 0.3.3

### Patch Changes

- [#636](https://github.com/halfdomelabs/baseplate/pull/636) [`1815ac5`](https://github.com/halfdomelabs/baseplate/commit/1815ac50cb2d9cc69c8c82187b3d597467b9f367) Thanks [@kingston](https://github.com/kingston)! - Fix creation of admin sections

- Updated dependencies []:
  - @baseplate-dev/project-builder-lib@0.3.3
  - @baseplate-dev/ui-components@0.3.3
  - @baseplate-dev/utils@0.3.3

## 0.3.2

### Patch Changes

- Updated dependencies [[`cca138a`](https://github.com/halfdomelabs/baseplate/commit/cca138a84abbb901ab628bf571ae29211a180dbb)]:
  - @baseplate-dev/project-builder-lib@0.3.2
  - @baseplate-dev/ui-components@0.3.2
  - @baseplate-dev/utils@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/project-builder-lib@0.3.1
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

- [#627](https://github.com/halfdomelabs/baseplate/pull/627) [`aaf8634`](https://github.com/halfdomelabs/baseplate/commit/aaf8634abcf76d938072c7afc43e6e99a2519b13) Thanks [@kingston](https://github.com/kingston)! - Add updated UI for admin interface

- [#624](https://github.com/halfdomelabs/baseplate/pull/624) [`d0b08b8`](https://github.com/halfdomelabs/baseplate/commit/d0b08b89a07b9aa845212ec90e2a6123fbecbbe5) Thanks [@kingston](https://github.com/kingston)! - Upgrade Tanstack Router to 1.130.8 and revert from="/" workaround for Link bug

- Updated dependencies [[`aaf8634`](https://github.com/halfdomelabs/baseplate/commit/aaf8634abcf76d938072c7afc43e6e99a2519b13), [`85e6413`](https://github.com/halfdomelabs/baseplate/commit/85e6413f8e3ad0043daca3bb9fa3ca5a27843a65)]:
  - @baseplate-dev/ui-components@0.3.0
  - @baseplate-dev/project-builder-lib@0.3.0
  - @baseplate-dev/utils@0.3.0

## 0.2.6

### Patch Changes

- [#615](https://github.com/halfdomelabs/baseplate/pull/615) [`e639251`](https://github.com/halfdomelabs/baseplate/commit/e639251f25094bb17f126e8604e505b1037b5640) Thanks [@kingston](https://github.com/kingston)! - Fix model merger not being able to create new models from scratch

- Updated dependencies [[`541db59`](https://github.com/halfdomelabs/baseplate/commit/541db59ccf868b6a6fcc8fa756eab0dfa560d193), [`e639251`](https://github.com/halfdomelabs/baseplate/commit/e639251f25094bb17f126e8604e505b1037b5640), [`cc6cd6c`](https://github.com/halfdomelabs/baseplate/commit/cc6cd6cce6bd0d97a68d7bd5b46408e0877d990b)]:
  - @baseplate-dev/ui-components@0.2.6
  - @baseplate-dev/project-builder-lib@0.2.6
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

- Updated dependencies [[`01c47c7`](https://github.com/halfdomelabs/baseplate/commit/01c47c77f039a463de03271de6461cd969d5a8e8)]:
  - @baseplate-dev/project-builder-lib@0.2.5
  - @baseplate-dev/ui-components@0.2.5
  - @baseplate-dev/utils@0.2.5

## 0.2.4

### Patch Changes

- Updated dependencies [[`ffe791f`](https://github.com/halfdomelabs/baseplate/commit/ffe791f6ab44e82c8481f3a18df9262dec71cff6)]:
  - @baseplate-dev/utils@0.2.4
  - @baseplate-dev/project-builder-lib@0.2.4
  - @baseplate-dev/ui-components@0.2.4

## 0.2.3

### Patch Changes

- [#595](https://github.com/halfdomelabs/baseplate/pull/595) [`a506e88`](https://github.com/halfdomelabs/baseplate/commit/a506e88893bf395916ef3fbf6dd9dd7c0ff17acb) Thanks [@kingston](https://github.com/kingston)! - Fix bug in app creation that was re-using the same ID

- [#595](https://github.com/halfdomelabs/baseplate/pull/595) [`a506e88`](https://github.com/halfdomelabs/baseplate/commit/a506e88893bf395916ef3fbf6dd9dd7c0ff17acb) Thanks [@kingston](https://github.com/kingston)! - Upgrade react-hook-form to 7.60.0

- Updated dependencies [[`903e2d8`](https://github.com/halfdomelabs/baseplate/commit/903e2d898c47e6559f55f023eb89a0b524098f3a), [`a506e88`](https://github.com/halfdomelabs/baseplate/commit/a506e88893bf395916ef3fbf6dd9dd7c0ff17acb)]:
  - @baseplate-dev/ui-components@0.2.3
  - @baseplate-dev/project-builder-lib@0.2.3
  - @baseplate-dev/utils@0.2.3

## 0.2.2

### Patch Changes

- [#585](https://github.com/halfdomelabs/baseplate/pull/585) [`def0b7a`](https://github.com/halfdomelabs/baseplate/commit/def0b7a202ce49a93714a8acf876ff845c2e8e24) Thanks [@kingston](https://github.com/kingston)! - Convert all `*.page.tsx` files to the new Tanstack Router file-based routing system.

- [#587](https://github.com/halfdomelabs/baseplate/pull/587) [`b6bc11f`](https://github.com/halfdomelabs/baseplate/commit/b6bc11fdf199c8de40832eb88ea6f6cfc83aa5d7) Thanks [@kingston](https://github.com/kingston)! - Migrate reference system from ZodRef to transform-based architecture
  - Complete migration from legacy ZodRef system to new transform-based reference processing using marker classes and schema transformations
  - Implement `deserializeSchemaWithTransformedReferences` for integration testing with real-world usage patterns
  - Replace `fixRefDeletions` implementation to use new transform system with `parseSchemaWithTransformedReferences`
  - Add comprehensive test coverage using integration tests with `deserializeSchemaWithTransformedReferences` instead of manual marker creation
  - Support for complex reference scenarios including nested references, parent-child relationships, and custom name resolvers
  - Rename `SET_NULL` to `SET_UNDEFINED` and add array context detection to prevent JSON serialization issues
  - Add omit pattern support to `useEnumForm` hook for consistency with `useModelForm`

- Updated dependencies [[`f8c9284`](https://github.com/halfdomelabs/baseplate/commit/f8c9284752c12c6aab70481bf98e6fa402e61075), [`b6bc11f`](https://github.com/halfdomelabs/baseplate/commit/b6bc11fdf199c8de40832eb88ea6f6cfc83aa5d7)]:
  - @baseplate-dev/utils@0.2.2
  - @baseplate-dev/project-builder-lib@0.2.2
  - @baseplate-dev/ui-components@0.2.2

## 0.2.1

### Patch Changes

- [#583](https://github.com/halfdomelabs/baseplate/pull/583) [`4d7677e`](https://github.com/halfdomelabs/baseplate/commit/4d7677e8ef2da8ed045ee7fe409519f0f124b34c) Thanks [@kingston](https://github.com/kingston)! - Update UI for app editor

- [#584](https://github.com/halfdomelabs/baseplate/pull/584) [`df2c7d5`](https://github.com/halfdomelabs/baseplate/commit/df2c7d59895944991a1c569862187eb787db2d4c) Thanks [@kingston](https://github.com/kingston)! - Fix inability to create a new field

- Updated dependencies [[`4d7677e`](https://github.com/halfdomelabs/baseplate/commit/4d7677e8ef2da8ed045ee7fe409519f0f124b34c)]:
  - @baseplate-dev/ui-components@0.2.1
  - @baseplate-dev/project-builder-lib@0.2.1
  - @baseplate-dev/utils@0.2.1

## 0.2.0

### Patch Changes

- [#568](https://github.com/halfdomelabs/baseplate/pull/568) [`06b4faf`](https://github.com/halfdomelabs/baseplate/commit/06b4fafaf3d2ed848d959a9911b9bfa26702d4a3) Thanks [@kingston](https://github.com/kingston)! - Enable the import-x/consistent-type-specifier-style rule to clean up type imports

- [#576](https://github.com/halfdomelabs/baseplate/pull/576) [`fd63554`](https://github.com/halfdomelabs/baseplate/commit/fd635544eb6df0385501f61f3e51bce554633458) Thanks [@kingston](https://github.com/kingston)! - Rename entity UID to Key to make it clearer what is happening

- Updated dependencies [[`06b4faf`](https://github.com/halfdomelabs/baseplate/commit/06b4fafaf3d2ed848d959a9911b9bfa26702d4a3), [`3198895`](https://github.com/halfdomelabs/baseplate/commit/3198895bc45f6ff031e3d1e2c8554ddc3a30261d), [`fd63554`](https://github.com/halfdomelabs/baseplate/commit/fd635544eb6df0385501f61f3e51bce554633458), [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9)]:
  - @baseplate-dev/project-builder-lib@0.2.0
  - @baseplate-dev/ui-components@0.2.0
  - @baseplate-dev/utils@0.2.0

## 0.1.3

### Patch Changes

- [#564](https://github.com/halfdomelabs/baseplate/pull/564) [`8631cfe`](https://github.com/halfdomelabs/baseplate/commit/8631cfec32f1e5286d6d1ab0eb0e858461672545) Thanks [@kingston](https://github.com/kingston)! - Add support for model merging the GraphQL object type

- [#562](https://github.com/halfdomelabs/baseplate/pull/562) [`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad) Thanks [@kingston](https://github.com/kingston)! - Switch to Typescript project references for building/watching project

- Updated dependencies [[`8631cfe`](https://github.com/halfdomelabs/baseplate/commit/8631cfec32f1e5286d6d1ab0eb0e858461672545), [`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad)]:
  - @baseplate-dev/project-builder-lib@0.1.3
  - @baseplate-dev/ui-components@0.1.3
  - @baseplate-dev/utils@0.1.3

## 0.1.2

### Patch Changes

- [#560](https://github.com/halfdomelabs/baseplate/pull/560) [`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8) Thanks [@kingston](https://github.com/kingston)! - Add README files to all packages and plugins explaining their purpose within the Baseplate monorepo.

- Updated dependencies [[`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8)]:
  - @baseplate-dev/project-builder-lib@0.1.2
  - @baseplate-dev/ui-components@0.1.2
  - @baseplate-dev/utils@0.1.2

## 0.1.1

### Patch Changes

- [#559](https://github.com/halfdomelabs/baseplate/pull/559) [`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b) Thanks [@kingston](https://github.com/kingston)! - Rename workspace to @baseplate-dev/\* and reset versions to 0.1.0

- [#557](https://github.com/halfdomelabs/baseplate/pull/557) [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad) Thanks [@kingston](https://github.com/kingston)! - Update LICENSE to modified MPL-2.0 license

- Updated dependencies [[`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b), [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad)]:
  - @baseplate-dev/project-builder-lib@0.1.1
  - @baseplate-dev/ui-components@0.1.1
  - @baseplate-dev/utils@0.1.1
