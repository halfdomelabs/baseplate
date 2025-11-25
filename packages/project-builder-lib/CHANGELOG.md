# @baseplate-dev/project-builder-lib

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
