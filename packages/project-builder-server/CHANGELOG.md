# @baseplate-dev/project-builder-server

## 0.3.7

### Patch Changes

- [#667](https://github.com/halfdomelabs/baseplate/pull/667) [`e4ed458`](https://github.com/halfdomelabs/baseplate/commit/e4ed458682ae533cdd98e290049027f79519a8b9) Thanks [@kingston](https://github.com/kingston)! - Enable throttling on sync metadata writes

- Updated dependencies [[`9508a8e`](https://github.com/halfdomelabs/baseplate/commit/9508a8ee75e33ea0c0632f3f5ef5621b020f530d), [`d6f70e0`](https://github.com/halfdomelabs/baseplate/commit/d6f70e03f539bd8687d9e9abfc0e7cef5c9e6e29), [`9508a8e`](https://github.com/halfdomelabs/baseplate/commit/9508a8ee75e33ea0c0632f3f5ef5621b020f530d)]:
  - @baseplate-dev/core-generators@0.3.7
  - @baseplate-dev/fastify-generators@0.3.7
  - @baseplate-dev/react-generators@0.3.7
  - @baseplate-dev/project-builder-lib@0.3.7
  - @baseplate-dev/sync@0.3.7
  - @baseplate-dev/utils@0.3.7

## 0.3.6

### Patch Changes

- Updated dependencies [[`1186a21`](https://github.com/halfdomelabs/baseplate/commit/1186a21df267d112a84a42ff1d3c87b495452ce0), [`354b975`](https://github.com/halfdomelabs/baseplate/commit/354b9754e126f4e9f6f4cda0ac4e5f7ca15c0160)]:
  - @baseplate-dev/core-generators@0.3.6
  - @baseplate-dev/react-generators@0.3.6
  - @baseplate-dev/fastify-generators@0.3.6
  - @baseplate-dev/project-builder-lib@0.3.6
  - @baseplate-dev/sync@0.3.6
  - @baseplate-dev/utils@0.3.6

## 0.3.5

### Patch Changes

- [#658](https://github.com/halfdomelabs/baseplate/pull/658) [`fe86213`](https://github.com/halfdomelabs/baseplate/commit/fe86213911e935f2f34ffd9b2b3a39b1b3194aad) Thanks [@kingston](https://github.com/kingston)! - Fix admin section paths with spaces in them

- Updated dependencies [[`6d0be95`](https://github.com/halfdomelabs/baseplate/commit/6d0be954ba866414fb673694a72e73ab433c7b12)]:
  - @baseplate-dev/react-generators@0.3.5
  - @baseplate-dev/core-generators@0.3.5
  - @baseplate-dev/fastify-generators@0.3.5
  - @baseplate-dev/project-builder-lib@0.3.5
  - @baseplate-dev/sync@0.3.5
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

- Updated dependencies [[`67dba69`](https://github.com/halfdomelabs/baseplate/commit/67dba697439e6bc76b81522c133d920af4dbdbb1), [`217de38`](https://github.com/halfdomelabs/baseplate/commit/217de385f3ac869c5ef740af32634db9bcab6b0c), [`67dba69`](https://github.com/halfdomelabs/baseplate/commit/67dba697439e6bc76b81522c133d920af4dbdbb1), [`f450b7f`](https://github.com/halfdomelabs/baseplate/commit/f450b7f75cf5ad71c2bdb1c077526251aa240dd0), [`7d9e6d0`](https://github.com/halfdomelabs/baseplate/commit/7d9e6d01e0a9920cee4c4d499beeffc1c663494a)]:
  - @baseplate-dev/sync@0.3.4
  - @baseplate-dev/fastify-generators@0.3.4
  - @baseplate-dev/react-generators@0.3.4
  - @baseplate-dev/project-builder-lib@0.3.4
  - @baseplate-dev/core-generators@0.3.4
  - @baseplate-dev/utils@0.3.4

## 0.3.3

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.3.3
  - @baseplate-dev/fastify-generators@0.3.3
  - @baseplate-dev/project-builder-lib@0.3.3
  - @baseplate-dev/react-generators@0.3.3
  - @baseplate-dev/sync@0.3.3
  - @baseplate-dev/utils@0.3.3

## 0.3.2

### Patch Changes

- Updated dependencies [[`cca138a`](https://github.com/halfdomelabs/baseplate/commit/cca138a84abbb901ab628bf571ae29211a180dbb), [`1419a96`](https://github.com/halfdomelabs/baseplate/commit/1419a965efd41d2b2dfb86dd18f32e5414a3af85), [`b4c15b9`](https://github.com/halfdomelabs/baseplate/commit/b4c15b98a518c53828f81624764ba693def85faf), [`b4c15b9`](https://github.com/halfdomelabs/baseplate/commit/b4c15b98a518c53828f81624764ba693def85faf), [`04a4978`](https://github.com/halfdomelabs/baseplate/commit/04a49785642685ca4b56aec27dc0a18520674ef9), [`cca138a`](https://github.com/halfdomelabs/baseplate/commit/cca138a84abbb901ab628bf571ae29211a180dbb)]:
  - @baseplate-dev/project-builder-lib@0.3.2
  - @baseplate-dev/react-generators@0.3.2
  - @baseplate-dev/core-generators@0.3.2
  - @baseplate-dev/fastify-generators@0.3.2
  - @baseplate-dev/sync@0.3.2
  - @baseplate-dev/utils@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies [[`d79b0cf`](https://github.com/halfdomelabs/baseplate/commit/d79b0cfb9061dbeccc976a2f018b264849bef788), [`d79b0cf`](https://github.com/halfdomelabs/baseplate/commit/d79b0cfb9061dbeccc976a2f018b264849bef788)]:
  - @baseplate-dev/core-generators@0.3.1
  - @baseplate-dev/react-generators@0.3.1
  - @baseplate-dev/fastify-generators@0.3.1
  - @baseplate-dev/project-builder-lib@0.3.1
  - @baseplate-dev/sync@0.3.1
  - @baseplate-dev/utils@0.3.1

## 0.3.0

### Patch Changes

- [#619](https://github.com/halfdomelabs/baseplate/pull/619) [`687a47e`](https://github.com/halfdomelabs/baseplate/commit/687a47e5e39abc5138ba3fc2d0db9cfee6e4dbfe) Thanks [@kingston](https://github.com/kingston)! - Implement structured directory snapshots for baseplate diff to detect deleted files

  The `baseplate diff` command now provides complete diff coverage by detecting files that exist in the working directory but not in the generated output (deleted files). This enhancement includes:
  - Added `scanWorkingDirectory` function using `globby` for efficient directory traversal
  - Updated `compareFiles` function to detect and report deleted files in addition to added and modified files
  - Enhanced diff output to show deleted files with proper formatting and unified diffs
  - Added comprehensive unit tests for the new directory scanning functionality
  - Maintained compatibility with existing ignore patterns and glob filters

  **New Default Ignore Patterns:**
  - Added `baseplate/**/*` to ignore Baseplate configuration and project definition files
  - Added `prisma/migrations/**/*` to ignore Prisma migration files that are auto-generated

  This addresses the TODO in the diff implementation and provides developers with a complete picture of differences between generated and working directory files while filtering out commonly ignored directories.

- [#619](https://github.com/halfdomelabs/baseplate/pull/619) [`687a47e`](https://github.com/halfdomelabs/baseplate/commit/687a47e5e39abc5138ba3fc2d0db9cfee6e4dbfe) Thanks [@kingston](https://github.com/kingston)! - Add comprehensive snapshot management CLI commands for granular control of project differences

  This adds a complete suite of snapshot commands to manage persistent differences between generated and working codebases:

  **New Commands:**
  - `baseplate snapshot save <project-directory> <app>` - Save snapshot of current differences (with confirmation prompt)
  - `baseplate snapshot add <project-directory> <app> <files...>` - Add specific files to snapshot tracking
  - `baseplate snapshot add --deleted <project-directory> <app> <files...>` - Mark files as intentionally deleted
  - `baseplate snapshot remove <project-directory> <app> <files...>` - Remove files from snapshot tracking
  - `baseplate snapshot show <project-directory> <app>` - Display current snapshot contents

  **Features:**
  - Granular file-level snapshot management following established CLI patterns
  - Integration with existing snapshot storage system (`.baseplate-snapshot/` directory)
  - Automatic snapshot directory resolution with `--snapshot-dir` option
  - Comprehensive error handling and user confirmation for destructive operations
  - Support for tracking both modified and intentionally deleted files

  These commands enable the generator development workflow described in the design doc, allowing developers to maintain persistent baselines of expected differences while iterating on generator templates.

- [#619](https://github.com/halfdomelabs/baseplate/pull/619) [`687a47e`](https://github.com/halfdomelabs/baseplate/commit/687a47e5e39abc5138ba3fc2d0db9cfee6e4dbfe) Thanks [@kingston](https://github.com/kingston)! - Implement snapshot application in sync command when overwrite mode is enabled. When `baseplate sync --overwrite` is used with snapshots, the sync process now applies snapshot diffs to the generated output before writing files to the filesystem, matching the behavior described in the design doc.

- Updated dependencies [[`82cee71`](https://github.com/halfdomelabs/baseplate/commit/82cee7183ef384e1777e7a563656441ff108e2b3), [`687a47e`](https://github.com/halfdomelabs/baseplate/commit/687a47e5e39abc5138ba3fc2d0db9cfee6e4dbfe), [`85e6413`](https://github.com/halfdomelabs/baseplate/commit/85e6413f8e3ad0043daca3bb9fa3ca5a27843a65), [`8ec33fc`](https://github.com/halfdomelabs/baseplate/commit/8ec33fcdc8fea9cb20e79586b854bf075270ab53), [`d0b08b8`](https://github.com/halfdomelabs/baseplate/commit/d0b08b89a07b9aa845212ec90e2a6123fbecbbe5), [`fbde70f`](https://github.com/halfdomelabs/baseplate/commit/fbde70ffbcae025318480e9607924978847fba2b), [`96a3099`](https://github.com/halfdomelabs/baseplate/commit/96a3099ff9eba05fc3b3618b54407014cc555dc2)]:
  - @baseplate-dev/react-generators@0.3.0
  - @baseplate-dev/sync@0.3.0
  - @baseplate-dev/project-builder-lib@0.3.0
  - @baseplate-dev/fastify-generators@0.3.0
  - @baseplate-dev/core-generators@0.3.0
  - @baseplate-dev/utils@0.3.0

## 0.2.6

### Patch Changes

- Updated dependencies [[`541db59`](https://github.com/halfdomelabs/baseplate/commit/541db59ccf868b6a6fcc8fa756eab0dfa560d193), [`e639251`](https://github.com/halfdomelabs/baseplate/commit/e639251f25094bb17f126e8604e505b1037b5640), [`cc6cd6c`](https://github.com/halfdomelabs/baseplate/commit/cc6cd6cce6bd0d97a68d7bd5b46408e0877d990b)]:
  - @baseplate-dev/react-generators@0.2.6
  - @baseplate-dev/project-builder-lib@0.2.6
  - @baseplate-dev/core-generators@0.2.6
  - @baseplate-dev/fastify-generators@0.2.6
  - @baseplate-dev/sync@0.2.6
  - @baseplate-dev/utils@0.2.6

## 0.2.5

### Patch Changes

- [#614](https://github.com/halfdomelabs/baseplate/pull/614) [`e0d690c`](https://github.com/halfdomelabs/baseplate/commit/e0d690c1e139f93a8ff60c9e0c90bc72cdf705a4) Thanks [@kingston](https://github.com/kingston)! - Add .baseplateignore support and sync command with force-overwrite

  Enhance the `baseplate diff` command to support ignore patterns via a `.baseplateignore` file, similar to `.gitignore`. This reduces noise in diff output by filtering out expected differences like environment files, logs, and build artifacts.

  Additionally, introduces a new `baseplate sync` command (replacing `build`) with a `--force-overwrite` flag that respects ignore patterns when overwriting files.

  Features:
  - Uses `.baseplateignore` file in project root with gitignore-style syntax
  - Includes sensible default patterns (.env, \*.log, node_modules/, dist/, build/, .DS_Store, Thumbs.db)
  - Can be disabled with `--no-ignore-file` flag
  - Backward compatible (enabled by default)
  - Graceful fallback when `.baseplateignore` doesn't exist

- [#614](https://github.com/halfdomelabs/baseplate/pull/614) [`e0d690c`](https://github.com/halfdomelabs/baseplate/commit/e0d690c1e139f93a8ff60c9e0c90bc72cdf705a4) Thanks [@kingston](https://github.com/kingston)! - Add force overwrite mode for sync command

  Adds a `--force-overwrite` flag to the `baseplate sync` command that bypasses merge conflict detection and overwrites existing files with generated content without attempting to merge changes. When force overwrite is enabled, files matching patterns in `.baseplateignore` are automatically excluded from being overwritten to preserve user customizations.

  Also updates the diff command to load `.baseplateignore` patterns from each app directory instead of the base directory, providing more granular control over which files are ignored during diff operations.

- Updated dependencies [[`2aae451`](https://github.com/halfdomelabs/baseplate/commit/2aae45107cb6331234d14d8a6491b55e7f6d9f33), [`01c47c7`](https://github.com/halfdomelabs/baseplate/commit/01c47c77f039a463de03271de6461cd969d5a8e8), [`e0d690c`](https://github.com/halfdomelabs/baseplate/commit/e0d690c1e139f93a8ff60c9e0c90bc72cdf705a4), [`01c47c7`](https://github.com/halfdomelabs/baseplate/commit/01c47c77f039a463de03271de6461cd969d5a8e8), [`01c47c7`](https://github.com/halfdomelabs/baseplate/commit/01c47c77f039a463de03271de6461cd969d5a8e8), [`2aae451`](https://github.com/halfdomelabs/baseplate/commit/2aae45107cb6331234d14d8a6491b55e7f6d9f33)]:
  - @baseplate-dev/react-generators@0.2.5
  - @baseplate-dev/fastify-generators@0.2.5
  - @baseplate-dev/sync@0.2.5
  - @baseplate-dev/project-builder-lib@0.2.5
  - @baseplate-dev/core-generators@0.2.5
  - @baseplate-dev/utils@0.2.5

## 0.2.4

### Patch Changes

- Updated dependencies [[`ffe791f`](https://github.com/halfdomelabs/baseplate/commit/ffe791f6ab44e82c8481f3a18df9262dec71cff6), [`ffe791f`](https://github.com/halfdomelabs/baseplate/commit/ffe791f6ab44e82c8481f3a18df9262dec71cff6)]:
  - @baseplate-dev/utils@0.2.4
  - @baseplate-dev/react-generators@0.2.4
  - @baseplate-dev/core-generators@0.2.4
  - @baseplate-dev/fastify-generators@0.2.4
  - @baseplate-dev/project-builder-lib@0.2.4
  - @baseplate-dev/sync@0.2.4

## 0.2.3

### Patch Changes

- [#600](https://github.com/halfdomelabs/baseplate/pull/600) [`09f804e`](https://github.com/halfdomelabs/baseplate/commit/09f804e430180f42177d1fe34a2891618a04df16) Thanks [@kingston](https://github.com/kingston)! - Add command to diff generated output from actual output

  Adds a new `baseplate diff` command that shows the difference between what would be generated and what currently exists in the working directory. This helps developers avoid losing code when they write in generated files and then revert to test generation.

  Features:
  - Shows unified diff format by default
  - Supports `--compact` flag for summary format with change counts
  - Supports `--app` flag to filter by specific applications
  - Supports `--glob` flag to filter files by glob patterns
  - Handles binary files using isbinaryfile package
  - Modular design with separate utilities for diffing, formatting, and comparison

- [#604](https://github.com/halfdomelabs/baseplate/pull/604) [`228a3be`](https://github.com/halfdomelabs/baseplate/commit/228a3be02e514188da1c0a03ea9f1ba8d5383668) Thanks [@kingston](https://github.com/kingston)! - Change generated CRUD service file naming from model-service.ts to model.crud.ts pattern

  This change updates the service file generation to use explicit `.crud.ts` naming instead of the previous `-service.ts` pattern. This provides better separation between generated CRUD operations and future hand-written business logic files, supporting the planned architectural split between generated and manual code.

  Example changes:
  - `user-service.ts` → `user.crud.ts`
  - `todo-item-service.ts` → `todo-item.crud.ts`

- [#596](https://github.com/halfdomelabs/baseplate/pull/596) [`059edf7`](https://github.com/halfdomelabs/baseplate/commit/059edf771755f1ff846494f238d777a9d1f7f5d7) Thanks [@kingston](https://github.com/kingston)! - Simplify template metadata system by consolidating template definitions in extractor.json
  - Consolidate template definitions in extractor.json using template names as keys instead of file paths
  - Rename .template-metadata.json to .templates-info.json with simplified instance tracking
  - Remove file-id-map.json dependency and related file ID mapping logic
  - Update TemplateExtractorConfigLookup to work without file ID mapping
  - Update all template extractors and tests to use new metadata format
  - Add migration script to convert existing extractor.json files to new format

- [#596](https://github.com/halfdomelabs/baseplate/pull/596) [`059edf7`](https://github.com/halfdomelabs/baseplate/commit/059edf771755f1ff846494f238d777a9d1f7f5d7) Thanks [@kingston](https://github.com/kingston)! - Add templates generate CLI command for regenerating template files without extraction
  - Add `templates generate <directory> <app>` CLI command to regenerate template files from existing extractor.json configurations
  - Add `--skip-clean` option to skip cleaning output directories
  - Add `generateTemplateFiles` function in sync package that initializes plugins and writes generated files without running extraction
  - Add `generateTemplateFilesForProject` wrapper function in project-builder-server
  - Command allows manual modification of extractor.json followed by regeneration without full extraction process

- Updated dependencies [[`f3bd169`](https://github.com/halfdomelabs/baseplate/commit/f3bd169b8debc52628179ca6ebd93c20b8a6f841), [`a506e88`](https://github.com/halfdomelabs/baseplate/commit/a506e88893bf395916ef3fbf6dd9dd7c0ff17acb), [`3107a1b`](https://github.com/halfdomelabs/baseplate/commit/3107a1b6917c3b2d14c7e91e2972b06955ebb4ea), [`69eea11`](https://github.com/halfdomelabs/baseplate/commit/69eea11c3662fbad9b8d2283d5127195c8379c07), [`903e2d8`](https://github.com/halfdomelabs/baseplate/commit/903e2d898c47e6559f55f023eb89a0b524098f3a), [`de9e1b4`](https://github.com/halfdomelabs/baseplate/commit/de9e1b4f3a8a7dcf6b962781a0aa589eb970c7a8), [`f0cb763`](https://github.com/halfdomelabs/baseplate/commit/f0cb7632f04bfb487722785fac7218d76d3b7e3b), [`a506e88`](https://github.com/halfdomelabs/baseplate/commit/a506e88893bf395916ef3fbf6dd9dd7c0ff17acb), [`059edf7`](https://github.com/halfdomelabs/baseplate/commit/059edf771755f1ff846494f238d777a9d1f7f5d7), [`059edf7`](https://github.com/halfdomelabs/baseplate/commit/059edf771755f1ff846494f238d777a9d1f7f5d7), [`de9e1b4`](https://github.com/halfdomelabs/baseplate/commit/de9e1b4f3a8a7dcf6b962781a0aa589eb970c7a8)]:
  - @baseplate-dev/core-generators@0.2.3
  - @baseplate-dev/sync@0.2.3
  - @baseplate-dev/react-generators@0.2.3
  - @baseplate-dev/fastify-generators@0.2.3
  - @baseplate-dev/project-builder-lib@0.2.3
  - @baseplate-dev/utils@0.2.3

## 0.2.2

### Patch Changes

- [#585](https://github.com/halfdomelabs/baseplate/pull/585) [`def0b7a`](https://github.com/halfdomelabs/baseplate/commit/def0b7a202ce49a93714a8acf876ff845c2e8e24) Thanks [@kingston](https://github.com/kingston)! - Show project directory not found error for plugin discovery

- Updated dependencies [[`f8c9284`](https://github.com/halfdomelabs/baseplate/commit/f8c9284752c12c6aab70481bf98e6fa402e61075), [`f8c9284`](https://github.com/halfdomelabs/baseplate/commit/f8c9284752c12c6aab70481bf98e6fa402e61075), [`f8c9284`](https://github.com/halfdomelabs/baseplate/commit/f8c9284752c12c6aab70481bf98e6fa402e61075), [`b6bc11f`](https://github.com/halfdomelabs/baseplate/commit/b6bc11fdf199c8de40832eb88ea6f6cfc83aa5d7), [`dce88ac`](https://github.com/halfdomelabs/baseplate/commit/dce88ac8d1f951f7336c12c5e004107de3a23e97)]:
  - @baseplate-dev/utils@0.2.2
  - @baseplate-dev/sync@0.2.2
  - @baseplate-dev/react-generators@0.2.2
  - @baseplate-dev/project-builder-lib@0.2.2
  - @baseplate-dev/core-generators@0.2.2
  - @baseplate-dev/fastify-generators@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies [[`d7d9985`](https://github.com/halfdomelabs/baseplate/commit/d7d998540ca5886259f93b5020c4d8939c5cdf5f)]:
  - @baseplate-dev/react-generators@0.2.1
  - @baseplate-dev/core-generators@0.2.1
  - @baseplate-dev/project-builder-lib@0.2.1
  - @baseplate-dev/fastify-generators@0.2.1
  - @baseplate-dev/sync@0.2.1
  - @baseplate-dev/utils@0.2.1

## 0.2.0

### Patch Changes

- [#568](https://github.com/halfdomelabs/baseplate/pull/568) [`06b4faf`](https://github.com/halfdomelabs/baseplate/commit/06b4fafaf3d2ed848d959a9911b9bfa26702d4a3) Thanks [@kingston](https://github.com/kingston)! - Enable the import-x/consistent-type-specifier-style rule to clean up type imports

- [#576](https://github.com/halfdomelabs/baseplate/pull/576) [`fd63554`](https://github.com/halfdomelabs/baseplate/commit/fd635544eb6df0385501f61f3e51bce554633458) Thanks [@kingston](https://github.com/kingston)! - Rename entity UID to Key to make it clearer what is happening

- [#580](https://github.com/halfdomelabs/baseplate/pull/580) [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13) Thanks [@kingston](https://github.com/kingston)! - Add command to list available generators with templates

- [#570](https://github.com/halfdomelabs/baseplate/pull/570) [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9) Thanks [@kingston](https://github.com/kingston)! - Implement phase 1 of reverse template generator v2

- Updated dependencies [[`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13), [`06b4faf`](https://github.com/halfdomelabs/baseplate/commit/06b4fafaf3d2ed848d959a9911b9bfa26702d4a3), [`f5d7a6f`](https://github.com/halfdomelabs/baseplate/commit/f5d7a6f781b1799bb8ad197973e5cec04f869264), [`fd63554`](https://github.com/halfdomelabs/baseplate/commit/fd635544eb6df0385501f61f3e51bce554633458), [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13), [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13), [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9), [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13), [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9)]:
  - @baseplate-dev/react-generators@0.2.0
  - @baseplate-dev/project-builder-lib@0.2.0
  - @baseplate-dev/fastify-generators@0.2.0
  - @baseplate-dev/core-generators@0.2.0
  - @baseplate-dev/utils@0.2.0
  - @baseplate-dev/sync@0.2.0

## 0.1.3

### Patch Changes

- [#562](https://github.com/halfdomelabs/baseplate/pull/562) [`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad) Thanks [@kingston](https://github.com/kingston)! - Switch to Typescript project references for building/watching project
- [#566](https://github.com/halfdomelabs/baseplate/pull/566)[`6e853b5`](https://github.com/halfdomelabs/baseplate/commit/6e853b5765ea0830904cd132274f49872a61b3f8) Thanks [@kingston](https://github.com/kingston)! - Move the clean folder from `baseplate/.clean` to `baseplate/generated`

- Updated dependencies [[`8631cfe`](https://github.com/halfdomelabs/baseplate/commit/8631cfec32f1e5286d6d1ab0eb0e858461672545), [`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad)]:
  - @baseplate-dev/project-builder-lib@0.1.3
  - @baseplate-dev/fastify-generators@0.1.3
  - @baseplate-dev/react-generators@0.1.3
  - @baseplate-dev/core-generators@0.1.3
  - @baseplate-dev/utils@0.1.3
  - @baseplate-dev/sync@0.1.3

## 0.1.2

### Patch Changes

- [#560](https://github.com/halfdomelabs/baseplate/pull/560) [`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8) Thanks [@kingston](https://github.com/kingston)! - Add README files to all packages and plugins explaining their purpose within the Baseplate monorepo.

- Updated dependencies [[`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8)]:
  - @baseplate-dev/project-builder-lib@0.1.2
  - @baseplate-dev/sync@0.1.2
  - @baseplate-dev/core-generators@0.1.2
  - @baseplate-dev/react-generators@0.1.2
  - @baseplate-dev/fastify-generators@0.1.2
  - @baseplate-dev/utils@0.1.2

## 0.1.1

### Patch Changes

- [#559](https://github.com/halfdomelabs/baseplate/pull/559) [`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b) Thanks [@kingston](https://github.com/kingston)! - Rename workspace to @baseplate-dev/\* and reset versions to 0.1.0

- [#557](https://github.com/halfdomelabs/baseplate/pull/557) [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad) Thanks [@kingston](https://github.com/kingston)! - Update LICENSE to modified MPL-2.0 license

- Updated dependencies [[`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b), [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad)]:
  - @baseplate-dev/project-builder-lib@0.1.1
  - @baseplate-dev/fastify-generators@0.1.1
  - @baseplate-dev/react-generators@0.1.1
  - @baseplate-dev/core-generators@0.1.1
  - @baseplate-dev/utils@0.1.1
  - @baseplate-dev/sync@0.1.1
