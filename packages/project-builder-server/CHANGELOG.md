# @baseplate-dev/project-builder-server

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
