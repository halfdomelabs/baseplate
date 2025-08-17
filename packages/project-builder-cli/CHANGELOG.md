# @baseplate-dev/project-builder-cli

## 0.3.3

### Patch Changes

- Updated dependencies [[`1815ac5`](https://github.com/halfdomelabs/baseplate/commit/1815ac50cb2d9cc69c8c82187b3d597467b9f367)]:
  - @baseplate-dev/project-builder-web@0.3.3
  - @baseplate-dev/project-builder-common@0.3.3
  - @baseplate-dev/project-builder-lib@0.3.3
  - @baseplate-dev/project-builder-server@0.3.3
  - @baseplate-dev/utils@0.3.3

## 0.3.2

### Patch Changes

- Updated dependencies [[`cca138a`](https://github.com/halfdomelabs/baseplate/commit/cca138a84abbb901ab628bf571ae29211a180dbb)]:
  - @baseplate-dev/project-builder-lib@0.3.2
  - @baseplate-dev/project-builder-common@0.3.2
  - @baseplate-dev/project-builder-server@0.3.2
  - @baseplate-dev/project-builder-web@0.3.2
  - @baseplate-dev/utils@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/project-builder-common@0.3.1
  - @baseplate-dev/project-builder-server@0.3.1
  - @baseplate-dev/project-builder-web@0.3.1
  - @baseplate-dev/project-builder-lib@0.3.1
  - @baseplate-dev/utils@0.3.1

## 0.3.0

### Patch Changes

- [#626](https://github.com/halfdomelabs/baseplate/pull/626) [`8ec33fc`](https://github.com/halfdomelabs/baseplate/commit/8ec33fcdc8fea9cb20e79586b854bf075270ab53) Thanks [@kingston](https://github.com/kingston)! - Remove dotenv references and replace with native node --env-file option

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

- Updated dependencies [[`687a47e`](https://github.com/halfdomelabs/baseplate/commit/687a47e5e39abc5138ba3fc2d0db9cfee6e4dbfe), [`85e6413`](https://github.com/halfdomelabs/baseplate/commit/85e6413f8e3ad0043daca3bb9fa3ca5a27843a65), [`aaf8634`](https://github.com/halfdomelabs/baseplate/commit/aaf8634abcf76d938072c7afc43e6e99a2519b13), [`687a47e`](https://github.com/halfdomelabs/baseplate/commit/687a47e5e39abc5138ba3fc2d0db9cfee6e4dbfe), [`d0b08b8`](https://github.com/halfdomelabs/baseplate/commit/d0b08b89a07b9aa845212ec90e2a6123fbecbbe5), [`687a47e`](https://github.com/halfdomelabs/baseplate/commit/687a47e5e39abc5138ba3fc2d0db9cfee6e4dbfe)]:
  - @baseplate-dev/project-builder-server@0.3.0
  - @baseplate-dev/project-builder-lib@0.3.0
  - @baseplate-dev/project-builder-web@0.3.0
  - @baseplate-dev/project-builder-common@0.3.0
  - @baseplate-dev/utils@0.3.0

## 0.2.6

### Patch Changes

- Updated dependencies [[`e639251`](https://github.com/halfdomelabs/baseplate/commit/e639251f25094bb17f126e8604e505b1037b5640), [`cc6cd6c`](https://github.com/halfdomelabs/baseplate/commit/cc6cd6cce6bd0d97a68d7bd5b46408e0877d990b)]:
  - @baseplate-dev/project-builder-lib@0.2.6
  - @baseplate-dev/project-builder-web@0.2.6
  - @baseplate-dev/project-builder-server@0.2.6
  - @baseplate-dev/project-builder-common@0.2.6
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

- Updated dependencies [[`e0d690c`](https://github.com/halfdomelabs/baseplate/commit/e0d690c1e139f93a8ff60c9e0c90bc72cdf705a4), [`e0d690c`](https://github.com/halfdomelabs/baseplate/commit/e0d690c1e139f93a8ff60c9e0c90bc72cdf705a4), [`01c47c7`](https://github.com/halfdomelabs/baseplate/commit/01c47c77f039a463de03271de6461cd969d5a8e8)]:
  - @baseplate-dev/project-builder-server@0.2.5
  - @baseplate-dev/project-builder-lib@0.2.5
  - @baseplate-dev/project-builder-web@0.2.5
  - @baseplate-dev/project-builder-common@0.2.5
  - @baseplate-dev/utils@0.2.5

## 0.2.4

### Patch Changes

- Updated dependencies [[`ffe791f`](https://github.com/halfdomelabs/baseplate/commit/ffe791f6ab44e82c8481f3a18df9262dec71cff6)]:
  - @baseplate-dev/utils@0.2.4
  - @baseplate-dev/project-builder-common@0.2.4
  - @baseplate-dev/project-builder-lib@0.2.4
  - @baseplate-dev/project-builder-server@0.2.4
  - @baseplate-dev/project-builder-web@0.2.4

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

- [#596](https://github.com/halfdomelabs/baseplate/pull/596) [`059edf7`](https://github.com/halfdomelabs/baseplate/commit/059edf771755f1ff846494f238d777a9d1f7f5d7) Thanks [@kingston](https://github.com/kingston)! - Add templates generate CLI command for regenerating template files without extraction
  - Add `templates generate <directory> <app>` CLI command to regenerate template files from existing extractor.json configurations
  - Add `--skip-clean` option to skip cleaning output directories
  - Add `generateTemplateFiles` function in sync package that initializes plugins and writes generated files without running extraction
  - Add `generateTemplateFilesForProject` wrapper function in project-builder-server
  - Command allows manual modification of extractor.json followed by regeneration without full extraction process

- Updated dependencies [[`09f804e`](https://github.com/halfdomelabs/baseplate/commit/09f804e430180f42177d1fe34a2891618a04df16), [`228a3be`](https://github.com/halfdomelabs/baseplate/commit/228a3be02e514188da1c0a03ea9f1ba8d5383668), [`a506e88`](https://github.com/halfdomelabs/baseplate/commit/a506e88893bf395916ef3fbf6dd9dd7c0ff17acb), [`a506e88`](https://github.com/halfdomelabs/baseplate/commit/a506e88893bf395916ef3fbf6dd9dd7c0ff17acb), [`059edf7`](https://github.com/halfdomelabs/baseplate/commit/059edf771755f1ff846494f238d777a9d1f7f5d7), [`059edf7`](https://github.com/halfdomelabs/baseplate/commit/059edf771755f1ff846494f238d777a9d1f7f5d7)]:
  - @baseplate-dev/project-builder-server@0.2.3
  - @baseplate-dev/project-builder-web@0.2.3
  - @baseplate-dev/project-builder-common@0.2.3
  - @baseplate-dev/project-builder-lib@0.2.3
  - @baseplate-dev/utils@0.2.3

## 0.2.2

### Patch Changes

- [#585](https://github.com/halfdomelabs/baseplate/pull/585) [`def0b7a`](https://github.com/halfdomelabs/baseplate/commit/def0b7a202ce49a93714a8acf876ff845c2e8e24) Thanks [@kingston](https://github.com/kingston)! - Show project directory not found error for plugin discovery

- Updated dependencies [[`def0b7a`](https://github.com/halfdomelabs/baseplate/commit/def0b7a202ce49a93714a8acf876ff845c2e8e24), [`f8c9284`](https://github.com/halfdomelabs/baseplate/commit/f8c9284752c12c6aab70481bf98e6fa402e61075), [`def0b7a`](https://github.com/halfdomelabs/baseplate/commit/def0b7a202ce49a93714a8acf876ff845c2e8e24), [`b6bc11f`](https://github.com/halfdomelabs/baseplate/commit/b6bc11fdf199c8de40832eb88ea6f6cfc83aa5d7)]:
  - @baseplate-dev/project-builder-web@0.2.2
  - @baseplate-dev/utils@0.2.2
  - @baseplate-dev/project-builder-common@0.2.2
  - @baseplate-dev/project-builder-server@0.2.2
  - @baseplate-dev/project-builder-lib@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies [[`4d7677e`](https://github.com/halfdomelabs/baseplate/commit/4d7677e8ef2da8ed045ee7fe409519f0f124b34c), [`df2c7d5`](https://github.com/halfdomelabs/baseplate/commit/df2c7d59895944991a1c569862187eb787db2d4c)]:
  - @baseplate-dev/project-builder-web@0.2.1
  - @baseplate-dev/project-builder-lib@0.2.1
  - @baseplate-dev/project-builder-server@0.2.1
  - @baseplate-dev/project-builder-common@0.2.1
  - @baseplate-dev/utils@0.2.1

## 0.2.0

### Patch Changes

- [#568](https://github.com/halfdomelabs/baseplate/pull/568) [`06b4faf`](https://github.com/halfdomelabs/baseplate/commit/06b4fafaf3d2ed848d959a9911b9bfa26702d4a3) Thanks [@kingston](https://github.com/kingston)! - Enable the import-x/consistent-type-specifier-style rule to clean up type imports

- [#576](https://github.com/halfdomelabs/baseplate/pull/576) [`fd63554`](https://github.com/halfdomelabs/baseplate/commit/fd635544eb6df0385501f61f3e51bce554633458) Thanks [@kingston](https://github.com/kingston)! - Rename entity UID to Key to make it clearer what is happening

- [#580](https://github.com/halfdomelabs/baseplate/pull/580) [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13) Thanks [@kingston](https://github.com/kingston)! - Refactor template commands to allow listing/deleting of templates from CLI

- [#580](https://github.com/halfdomelabs/baseplate/pull/580) [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13) Thanks [@kingston](https://github.com/kingston)! - Add command to list available generators with templates

- [#570](https://github.com/halfdomelabs/baseplate/pull/570) [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9) Thanks [@kingston](https://github.com/kingston)! - Implement phase 1 of reverse template generator v2

- Updated dependencies [[`06b4faf`](https://github.com/halfdomelabs/baseplate/commit/06b4fafaf3d2ed848d959a9911b9bfa26702d4a3), [`fd63554`](https://github.com/halfdomelabs/baseplate/commit/fd635544eb6df0385501f61f3e51bce554633458), [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13), [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9)]:
  - @baseplate-dev/project-builder-server@0.2.0
  - @baseplate-dev/project-builder-lib@0.2.0
  - @baseplate-dev/project-builder-web@0.2.0
  - @baseplate-dev/utils@0.2.0
  - @baseplate-dev/project-builder-common@0.2.0

## 0.1.3

### Patch Changes

- [#562](https://github.com/halfdomelabs/baseplate/pull/562) [`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad) Thanks [@kingston](https://github.com/kingston)! - Switch to Typescript project references for building/watching project

- Updated dependencies [[`8631cfe`](https://github.com/halfdomelabs/baseplate/commit/8631cfec32f1e5286d6d1ab0eb0e858461672545), [`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad)]:
  - @baseplate-dev/project-builder-lib@0.1.3
  - @baseplate-dev/project-builder-web@0.1.3
  - @baseplate-dev/project-builder-server@0.1.3
  - @baseplate-dev/utils@0.1.3
  - @baseplate-dev/project-builder-common@0.1.3

## 0.1.2

### Patch Changes

- [#560](https://github.com/halfdomelabs/baseplate/pull/560) [`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8) Thanks [@kingston](https://github.com/kingston)! - Add README files to all packages and plugins explaining their purpose within the Baseplate monorepo.

- Updated dependencies [[`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8)]:
  - @baseplate-dev/project-builder-web@0.1.2
  - @baseplate-dev/project-builder-server@0.1.2
  - @baseplate-dev/project-builder-lib@0.1.2
  - @baseplate-dev/project-builder-common@0.1.2
  - @baseplate-dev/utils@0.1.2

## 0.1.1

### Patch Changes

- [#559](https://github.com/halfdomelabs/baseplate/pull/559) [`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b) Thanks [@kingston](https://github.com/kingston)! - Rename workspace to @baseplate-dev/\* and reset versions to 0.1.0

- [#557](https://github.com/halfdomelabs/baseplate/pull/557) [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad) Thanks [@kingston](https://github.com/kingston)! - Update LICENSE to modified MPL-2.0 license

- Updated dependencies [[`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b), [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad)]:
  - @baseplate-dev/project-builder-common@0.1.1
  - @baseplate-dev/project-builder-server@0.1.1
  - @baseplate-dev/project-builder-lib@0.1.1
  - @baseplate-dev/project-builder-web@0.1.1
  - @baseplate-dev/utils@0.1.1
