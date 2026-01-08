# @baseplate-dev/core-generators

## 0.5.0

### Patch Changes

- [#732](https://github.com/halfdomelabs/baseplate/pull/732) [`fbabdec`](https://github.com/halfdomelabs/baseplate/commit/fbabdecf6715c21799d1c224b3a2162ef1f49797) Thanks [@kingston](https://github.com/kingston)! - Remove root: 'src/' from vitest.config.ts

- [#735](https://github.com/halfdomelabs/baseplate/pull/735) [`9b31726`](https://github.com/halfdomelabs/baseplate/commit/9b31726ee0dce77dc7b16fa334eb597d86349599) Thanks [@kingston](https://github.com/kingston)! - Support ES2023 in Vite tsconfig generators and re-enable replaceAll ESLint rule for React apps

- [#731](https://github.com/halfdomelabs/baseplate/pull/731) [`97bd14e`](https://github.com/halfdomelabs/baseplate/commit/97bd14e381206b54e55c22264d1d406e83146146) Thanks [@kingston](https://github.com/kingston)! - Add support for library packages in addition to apps
  - Add `packages` array to ProjectDefinition schema with node-library type
  - Add `packagesFolder` to MonorepoSettings (default: "packages")
  - Create node-library generator with tsc build configuration
  - Add library package compiler for code generation
  - Update workspace patterns to include packages/\* folder
  - Add UI for creating and managing library packages in the Apps section

- [#733](https://github.com/halfdomelabs/baseplate/pull/733) [`2d5abd5`](https://github.com/halfdomelabs/baseplate/commit/2d5abd53fccfc2b15f8142fc796c5e4ea4c2f92a) Thanks [@kingston](https://github.com/kingston)! - Upgrade pnpm to 10.27.0 and add `blockExoticSubdeps: true` to generated pnpm-workspace.yaml

- [#734](https://github.com/halfdomelabs/baseplate/pull/734) [`8bfc742`](https://github.com/halfdomelabs/baseplate/commit/8bfc742b8a93393a5539babfd11b97a88ee9c39e) Thanks [@kingston](https://github.com/kingston)! - Upgrade vitest to 4.0.16
  - vitest: 3.2.4 → 4.0.16
  - @vitest/eslint-plugin: 1.3.4 → 1.6.5

  Breaking changes addressed:
  - Updated `UserConfig` type to `ViteUserConfig` in vitest config files
  - Fixed mock type annotations for vitest 4.0 compatibility

- Updated dependencies [[`c7d373e`](https://github.com/halfdomelabs/baseplate/commit/c7d373ebaaeda2522515fdaeae0d37d0cd9ce7fe), [`8bfc742`](https://github.com/halfdomelabs/baseplate/commit/8bfc742b8a93393a5539babfd11b97a88ee9c39e)]:
  - @baseplate-dev/sync@0.5.0
  - @baseplate-dev/utils@0.5.0

## 0.4.4

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/sync@0.4.4
  - @baseplate-dev/utils@0.4.4

## 0.4.3

### Patch Changes

- [#717](https://github.com/halfdomelabs/baseplate/pull/717) [`83e4e7f`](https://github.com/halfdomelabs/baseplate/commit/83e4e7f60adf67480cebb4ff419c015ff282010d) Thanks [@kingston](https://github.com/kingston)! - Add support for generating vitest on web apps

- [#722](https://github.com/halfdomelabs/baseplate/pull/722) [`8622c4e`](https://github.com/halfdomelabs/baseplate/commit/8622c4e2b91788ad4a368c9f06f82a17ee1a29ed) Thanks [@kingston](https://github.com/kingston)! - Add support for generating files in package.json

- Updated dependencies []:
  - @baseplate-dev/sync@0.4.3
  - @baseplate-dev/utils@0.4.3

## 0.4.2

### Patch Changes

- [#701](https://github.com/halfdomelabs/baseplate/pull/701) [`e8576b9`](https://github.com/halfdomelabs/baseplate/commit/e8576b9ba5912acf9d81bcc1b18a0fbc8df91220) Thanks [@kingston](https://github.com/kingston)! - Upgrade to Zod v4

- [#697](https://github.com/halfdomelabs/baseplate/pull/697) [`11fa86f`](https://github.com/halfdomelabs/baseplate/commit/11fa86fb8e7a209175f132b1b3d59cd24cf13d54) Thanks [@kingston](https://github.com/kingston)! - Ignore \*.map files from built output in package.json

- [#713](https://github.com/halfdomelabs/baseplate/pull/713) [`74529e7`](https://github.com/halfdomelabs/baseplate/commit/74529e7fffae8a70f8cfe801a1897204d010e291) Thanks [@kingston](https://github.com/kingston)! - Migrate Vitest global setup from single merged file to individual files per generator
  - Replace `globalSetupOperations` Map with `globalSetupFiles` array in vitest config provider
  - Vitest generator now always renders `global-setup-env.ts` for environment loading
  - Each generator (Redis, Prisma) now creates its own global setup file
  - Vitest config outputs `globalSetup` as an array with env file first, then sorted additional files

- [#694](https://github.com/halfdomelabs/baseplate/pull/694) [`4be6c7d`](https://github.com/halfdomelabs/baseplate/commit/4be6c7dc7d900c37585b93cf5bb7198de6a41f1f) Thanks [@kingston](https://github.com/kingston)! - Add test:affected command to monorepo

- Updated dependencies [[`795ee4c`](https://github.com/halfdomelabs/baseplate/commit/795ee4c18e7b393fb9247ced23a12de5e219ab15), [`11fa86f`](https://github.com/halfdomelabs/baseplate/commit/11fa86fb8e7a209175f132b1b3d59cd24cf13d54), [`4be6c7d`](https://github.com/halfdomelabs/baseplate/commit/4be6c7dc7d900c37585b93cf5bb7198de6a41f1f)]:
  - @baseplate-dev/sync@0.4.2
  - @baseplate-dev/utils@0.4.2

## 0.4.1

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/sync@0.4.1
  - @baseplate-dev/utils@0.4.1

## 0.4.0

### Patch Changes

- [#692](https://github.com/halfdomelabs/baseplate/pull/692) [`c3c2a00`](https://github.com/halfdomelabs/baseplate/commit/c3c2a001d57a21f76e064af55941a43bedf26f18) Thanks [@kingston](https://github.com/kingston)! - Set maxWorkers to 1 to allow for integration tests to work properly. Note: This is a temporary solution until we implement parallel db tests.

- [#677](https://github.com/halfdomelabs/baseplate/pull/677) [`6daff18`](https://github.com/halfdomelabs/baseplate/commit/6daff18a033d2d78746984edebba4d8c6fe957a5) Thanks [@kingston](https://github.com/kingston)! - Fix improper name for declaration() and typeDeclaration() when name is default

- Updated dependencies [[`839cbdf`](https://github.com/halfdomelabs/baseplate/commit/839cbdfc6ddc059aa86d24bf6ec5d8e95cce9042), [`c3c2a00`](https://github.com/halfdomelabs/baseplate/commit/c3c2a001d57a21f76e064af55941a43bedf26f18)]:
  - @baseplate-dev/sync@0.4.0
  - @baseplate-dev/utils@0.4.0

## 0.3.8

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/sync@0.3.8
  - @baseplate-dev/utils@0.3.8

## 0.3.7

### Patch Changes

- [#666](https://github.com/halfdomelabs/baseplate/pull/666) [`9508a8e`](https://github.com/halfdomelabs/baseplate/commit/9508a8ee75e33ea0c0632f3f5ef5621b020f530d) Thanks [@kingston](https://github.com/kingston)! - Add node/browser globals to the eslint configuration with 'globals' package dependency

- Updated dependencies []:
  - @baseplate-dev/sync@0.3.7
  - @baseplate-dev/utils@0.3.7

## 0.3.6

### Patch Changes

- [#663](https://github.com/halfdomelabs/baseplate/pull/663) [`1186a21`](https://github.com/halfdomelabs/baseplate/commit/1186a21df267d112a84a42ff1d3c87b495452ce0) Thanks [@kingston](https://github.com/kingston)! - Upgrade axios to 1.12.0
  - axios: 1.8.3 → 1.12.0

  This upgrade brings the latest axios features and security improvements for generated projects that use axios functionality.

- Updated dependencies []:
  - @baseplate-dev/sync@0.3.6
  - @baseplate-dev/utils@0.3.6

## 0.3.5

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/sync@0.3.5
  - @baseplate-dev/utils@0.3.5

## 0.3.4

### Patch Changes

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

## 0.3.3

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/sync@0.3.3
  - @baseplate-dev/utils@0.3.3

## 0.3.2

### Patch Changes

- [#631](https://github.com/halfdomelabs/baseplate/pull/631) [`b4c15b9`](https://github.com/halfdomelabs/baseplate/commit/b4c15b98a518c53828f81624764ba693def85faf) Thanks [@kingston](https://github.com/kingston)! - Add template replacements support for TypeScript templates to enable dynamic value substitution in generated code

- Updated dependencies []:
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

- Updated dependencies []:
  - @baseplate-dev/sync@0.3.1
  - @baseplate-dev/utils@0.3.1

## 0.3.0

### Patch Changes

- [#626](https://github.com/halfdomelabs/baseplate/pull/626) [`8ec33fc`](https://github.com/halfdomelabs/baseplate/commit/8ec33fcdc8fea9cb20e79586b854bf075270ab53) Thanks [@kingston](https://github.com/kingston)! - Remove dotenv references and replace with native node --env-file option

- [#621](https://github.com/halfdomelabs/baseplate/pull/621) [`fbde70f`](https://github.com/halfdomelabs/baseplate/commit/fbde70ffbcae025318480e9607924978847fba2b) Thanks [@kingston](https://github.com/kingston)! - Update package versions to match latest dependencies from main repo
  - Update ESLint and related plugins to latest versions
  - Update TypeScript ESLint to 8.38.0
  - Update Prettier plugins to latest versions
  - Update Tailwind CSS Prettier plugin to 0.6.14

- Updated dependencies [[`687a47e`](https://github.com/halfdomelabs/baseplate/commit/687a47e5e39abc5138ba3fc2d0db9cfee6e4dbfe)]:
  - @baseplate-dev/sync@0.3.0
  - @baseplate-dev/utils@0.3.0

## 0.2.6

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/sync@0.2.6
  - @baseplate-dev/utils@0.2.6

## 0.2.5

### Patch Changes

- [#613](https://github.com/halfdomelabs/baseplate/pull/613) [`2aae451`](https://github.com/halfdomelabs/baseplate/commit/2aae45107cb6331234d14d8a6491b55e7f6d9f33) Thanks [@kingston](https://github.com/kingston)! - Add $templateName syntax for intra-generator template references

  Templates can now reference other templates within the same generator using the `$templateName` syntax. This enables templates to access file paths of other templates in the same generator during generation.

  Key features:
  - Use `$templateName` in template files to reference other generator templates
  - Kebab-case template names are automatically converted to camelCase (e.g., `session-constants` → `sessionConstants`)
  - Configure referenced templates using the `referencedGeneratorTemplates` field in extractor.json
  - Works seamlessly with existing variable replacement and import maps
  - Provides clear error messages for missing template references

  Example usage:

  ```typescript
  // In template file
  import { Constants } from '$sessionConstants';
  import { Utils } from '$authUtils';

  // In extractor.json
  {
    "user-service": {
      "sourceFile": "services/user.service.ts",
      "referencedGeneratorTemplates": ["session-constants", "auth-utils"]
    }
  }
  ```

  This feature is designed for intra-generator template references only. For cross-generator references, continue using import map providers.

- Updated dependencies [[`e0d690c`](https://github.com/halfdomelabs/baseplate/commit/e0d690c1e139f93a8ff60c9e0c90bc72cdf705a4)]:
  - @baseplate-dev/sync@0.2.5
  - @baseplate-dev/utils@0.2.5

## 0.2.4

### Patch Changes

- Updated dependencies [[`ffe791f`](https://github.com/halfdomelabs/baseplate/commit/ffe791f6ab44e82c8481f3a18df9262dec71cff6)]:
  - @baseplate-dev/utils@0.2.4
  - @baseplate-dev/sync@0.2.4

## 0.2.3

### Patch Changes

- [#601](https://github.com/halfdomelabs/baseplate/pull/601) [`f3bd169`](https://github.com/halfdomelabs/baseplate/commit/f3bd169b8debc52628179ca6ebd93c20b8a6f841) Thanks [@kingston](https://github.com/kingston)! - Add template renderers for text and raw templates

  This adds corresponding template renderers for text and raw templates, following the same pattern as TypeScript template renderers. The new renderers provide consistent APIs for generating template rendering functions that can be used in generator code.

  Key features:
  - Text template renderers support both individual templates and template groups
  - Raw template renderers support individual templates (no groups needed)
  - Full TypeScript type safety with proper action input types
  - Integration with the template renderers plugin system
  - Consistent API design across all template types (TypeScript, text, raw)

  The renderers are automatically integrated with their respective file extractors and will be available for use in generated code.

- [#602](https://github.com/halfdomelabs/baseplate/pull/602) [`f0cb763`](https://github.com/halfdomelabs/baseplate/commit/f0cb7632f04bfb487722785fac7218d76d3b7e3b) Thanks [@kingston](https://github.com/kingston)! - Improve Docker Compose generation with security, resource management, and developer experience enhancements

  ## Version Upgrades
  - Upgrade PostgreSQL from 16.2 to 17.5-alpine
  - Upgrade Redis from 7.2.4 to 8.0-alpine
  - For existing projects, follow the upgrade guide at https://docs.baseplate.dev/guides/upgrading-postgres/

  ## Security Improvements
  - Use environment variables for all sensitive data (passwords, usernames)
  - Add `security_opt: no-new-privileges:true` to prevent privilege escalation
  - Fix Redis healthcheck to include authentication

  ## Networking
  - Create custom bridge network for better isolation
  - All services communicate over internal network

  ## Database Configuration
  - Add PostgreSQL environment variables: `POSTGRES_DB`, `POSTGRES_INITDB_ARGS`
  - Use default `postgres` user for simplicity in local development
  - Add container names for easier management
  - Improve volume configuration

  ## Redis Configuration
  - Add Redis memory limits (256MB) and eviction policy (no-eviction for BullMQ)
  - Configure maxmemory and maxmemory-policy

  ## Developer Experience
  - Add logging configuration to prevent disk filling (10MB max, 3 files)
  - Generate `.env.example` file with all available variables
  - Improve health checks with start periods
  - Better default values using project name
  - Fix interface bug in redis.ts (PostgresConfig → RedisConfig)

  ## Breaking Changes
  - PostgreSQL generator now requires additional config parameters (database, projectName)
  - Redis generator now requires projectName parameter
  - Generated Docker Compose files now use custom bridge network

- [#596](https://github.com/halfdomelabs/baseplate/pull/596) [`059edf7`](https://github.com/halfdomelabs/baseplate/commit/059edf771755f1ff846494f238d777a9d1f7f5d7) Thanks [@kingston](https://github.com/kingston)! - Simplify template metadata system by consolidating template definitions in extractor.json
  - Consolidate template definitions in extractor.json using template names as keys instead of file paths
  - Rename .template-metadata.json to .templates-info.json with simplified instance tracking
  - Remove file-id-map.json dependency and related file ID mapping logic
  - Update TemplateExtractorConfigLookup to work without file ID mapping
  - Update all template extractors and tests to use new metadata format
  - Add migration script to convert existing extractor.json files to new format

- Updated dependencies [[`a506e88`](https://github.com/halfdomelabs/baseplate/commit/a506e88893bf395916ef3fbf6dd9dd7c0ff17acb), [`059edf7`](https://github.com/halfdomelabs/baseplate/commit/059edf771755f1ff846494f238d777a9d1f7f5d7), [`059edf7`](https://github.com/halfdomelabs/baseplate/commit/059edf771755f1ff846494f238d777a9d1f7f5d7), [`de9e1b4`](https://github.com/halfdomelabs/baseplate/commit/de9e1b4f3a8a7dcf6b962781a0aa589eb970c7a8)]:
  - @baseplate-dev/sync@0.2.3
  - @baseplate-dev/utils@0.2.3

## 0.2.2

### Patch Changes

- [#589](https://github.com/halfdomelabs/baseplate/pull/589) [`dce88ac`](https://github.com/halfdomelabs/baseplate/commit/dce88ac8d1f951f7336c12c5e004107de3a23e97) Thanks [@kingston](https://github.com/kingston)! - Add Template Renderers plugin for auto-generated simplified template rendering APIs

  This new plugin reduces template rendering boilerplate by 70-80% by automatically generating pre-configured rendering functions. It follows the same architectural pattern as the typed templates system, with a TypeScript-specific renderer function (`renderTsTemplateRenderers`) that generates generic definitions consumed by the plugin.

  **Key Features:**
  - **Simplified API**: Reduces complex `renderTemplate`/`renderTemplateGroup` calls to simple `renderers.templateName.render()` calls
  - **Automatic Dependency Resolution**: Import map providers and task dependencies are automatically resolved
  - **Type Safety**: Generated interfaces provide full TypeScript type safety
  - **Generic Architecture**: Extensible to support future template types (text, raw, etc.)
  - **Backward Compatibility**: Existing generators continue working unchanged

  **Before:**

  ```typescript
  await builder.apply(
    typescriptFile.renderTemplateGroup({
      group: templates.hooksGroup,
      paths,
      variables: { useCurrentUser: { TPL_USER: userQueryName } },
      importMapProviders: { generatedGraphqlImports, reactErrorImports },
    }),
  );
  ```

  **After:**

  ```typescript
  await builder.apply(
    renderers.hooksGroup.render({
      variables: { useCurrentUser: { TPL_USER: userQueryName } },
    }),
  );
  ```

  The plugin automatically generates TypeScript interfaces, tasks with resolved dependencies, and exports that integrate seamlessly with the existing generator system.

- Updated dependencies [[`f8c9284`](https://github.com/halfdomelabs/baseplate/commit/f8c9284752c12c6aab70481bf98e6fa402e61075), [`f8c9284`](https://github.com/halfdomelabs/baseplate/commit/f8c9284752c12c6aab70481bf98e6fa402e61075)]:
  - @baseplate-dev/utils@0.2.2
  - @baseplate-dev/sync@0.2.2

## 0.2.1

### Patch Changes

- [#581](https://github.com/halfdomelabs/baseplate/pull/581) [`d7d9985`](https://github.com/halfdomelabs/baseplate/commit/d7d998540ca5886259f93b5020c4d8939c5cdf5f) Thanks [@kingston](https://github.com/kingston)! - Fix settings for prettier with Tailwind v4

- Updated dependencies []:
  - @baseplate-dev/sync@0.2.1
  - @baseplate-dev/utils@0.2.1

## 0.2.0

### Patch Changes

- [#568](https://github.com/halfdomelabs/baseplate/pull/568) [`06b4faf`](https://github.com/halfdomelabs/baseplate/commit/06b4fafaf3d2ed848d959a9911b9bfa26702d4a3) Thanks [@kingston](https://github.com/kingston)! - Enable the import-x/consistent-type-specifier-style rule to clean up type imports

- [#574](https://github.com/halfdomelabs/baseplate/pull/574) [`f5d7a6f`](https://github.com/halfdomelabs/baseplate/commit/f5d7a6f781b1799bb8ad197973e5cec04f869264) Thanks [@kingston](https://github.com/kingston)! - Refactored naming of project paths to output paths to be clearer about their meaning

- [#570](https://github.com/halfdomelabs/baseplate/pull/570) [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9) Thanks [@kingston](https://github.com/kingston)! - Implement phase 1 of reverse template generator v2

- Updated dependencies [[`06b4faf`](https://github.com/halfdomelabs/baseplate/commit/06b4fafaf3d2ed848d959a9911b9bfa26702d4a3), [`f5d7a6f`](https://github.com/halfdomelabs/baseplate/commit/f5d7a6f781b1799bb8ad197973e5cec04f869264), [`fd63554`](https://github.com/halfdomelabs/baseplate/commit/fd635544eb6df0385501f61f3e51bce554633458), [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13), [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9), [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13), [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9)]:
  - @baseplate-dev/utils@0.2.0
  - @baseplate-dev/sync@0.2.0

## 0.1.3

### Patch Changes

- [#562](https://github.com/halfdomelabs/baseplate/pull/562) [`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad) Thanks [@kingston](https://github.com/kingston)! - Switch to Typescript project references for building/watching project

- Updated dependencies [[`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad)]:
  - @baseplate-dev/utils@0.1.3
  - @baseplate-dev/sync@0.1.3

## 0.1.2

### Patch Changes

- [#560](https://github.com/halfdomelabs/baseplate/pull/560) [`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8) Thanks [@kingston](https://github.com/kingston)! - Add README files to all packages and plugins explaining their purpose within the Baseplate monorepo.

- Updated dependencies [[`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8)]:
  - @baseplate-dev/sync@0.1.2
  - @baseplate-dev/utils@0.1.2

## 0.1.1

### Patch Changes

- [#559](https://github.com/halfdomelabs/baseplate/pull/559) [`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b) Thanks [@kingston](https://github.com/kingston)! - Rename workspace to @baseplate-dev/\* and reset versions to 0.1.0

- [#557](https://github.com/halfdomelabs/baseplate/pull/557) [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad) Thanks [@kingston](https://github.com/kingston)! - Update LICENSE to modified MPL-2.0 license

- Updated dependencies [[`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b), [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad)]:
  - @baseplate-dev/utils@0.1.1
  - @baseplate-dev/sync@0.1.1
