# @baseplate-dev/sync

## 0.4.2

### Patch Changes

- [#706](https://github.com/halfdomelabs/baseplate/pull/706) [`795ee4c`](https://github.com/halfdomelabs/baseplate/commit/795ee4c18e7b393fb9247ced23a12de5e219ab15) Thanks [@kingston](https://github.com/kingston)! - Add test helper for creating console loggers

- [#697](https://github.com/halfdomelabs/baseplate/pull/697) [`11fa86f`](https://github.com/halfdomelabs/baseplate/commit/11fa86fb8e7a209175f132b1b3d59cd24cf13d54) Thanks [@kingston](https://github.com/kingston)! - Ignore \*.map files from built output in package.json

- Updated dependencies [[`11fa86f`](https://github.com/halfdomelabs/baseplate/commit/11fa86fb8e7a209175f132b1b3d59cd24cf13d54), [`4be6c7d`](https://github.com/halfdomelabs/baseplate/commit/4be6c7dc7d900c37585b93cf5bb7198de6a41f1f)]:
  - @baseplate-dev/utils@0.4.2

## 0.4.1

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.4.1

## 0.4.0

### Patch Changes

- [#690](https://github.com/halfdomelabs/baseplate/pull/690) [`839cbdf`](https://github.com/halfdomelabs/baseplate/commit/839cbdfc6ddc059aa86d24bf6ec5d8e95cce9042) Thanks [@kingston](https://github.com/kingston)! - Fix bug where overwrite was not overwriting noOverwrite files

- Updated dependencies [[`c3c2a00`](https://github.com/halfdomelabs/baseplate/commit/c3c2a001d57a21f76e064af55941a43bedf26f18)]:
  - @baseplate-dev/utils@0.4.0

## 0.3.8

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.3.8

## 0.3.7

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.3.7

## 0.3.6

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.3.6

## 0.3.5

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.3.5

## 0.3.4

### Patch Changes

- [#646](https://github.com/halfdomelabs/baseplate/pull/646) [`67dba69`](https://github.com/halfdomelabs/baseplate/commit/67dba697439e6bc76b81522c133d920af4dbdbb1) Thanks [@kingston](https://github.com/kingston)! - Enhance evented logger with Pino-style error handling and flexible message patterns
  - Add error serialization following Pino patterns (type, message, stack, cause, custom properties)
  - Support flexible message patterns: `logger.error(error)`, `logger.info({ message: 'text', userId: 123 })`, `logger.info({ msg: 'text' })`
  - Support message priority: string arg > obj.message > obj.msg > error.message > ''
  - Remove console logging from logger core (now pure event emitter)
  - Maintain full backward compatibility with existing string-based logging

- [#643](https://github.com/halfdomelabs/baseplate/pull/643) [`7d9e6d0`](https://github.com/halfdomelabs/baseplate/commit/7d9e6d01e0a9920cee4c4d499beeffc1c663494a) Thanks [@kingston](https://github.com/kingston)! - Upgrade to TypeScript 5.8 with erasable syntax only mode

  This upgrade modernizes the codebase with TypeScript 5.8, enables erasable syntax only mode for better performance, and updates runtime dependencies.

  **Key Changes:**
  - Upgraded TypeScript to version 5.8
  - Enabled `erasableSyntaxOnly` compiler option for improved build performance
  - Updated Node.js requirement to 22.18
  - Updated PNPM requirement to 10.15
  - Fixed parameter property syntax to be compatible with erasable syntax only mode

- Updated dependencies [[`7d9e6d0`](https://github.com/halfdomelabs/baseplate/commit/7d9e6d01e0a9920cee4c4d499beeffc1c663494a)]:
  - @baseplate-dev/utils@0.3.4

## 0.3.3

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.3.3

## 0.3.2

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies []:
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

- Updated dependencies []:
  - @baseplate-dev/utils@0.3.0

## 0.2.6

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.2.6

## 0.2.5

### Patch Changes

- [#614](https://github.com/halfdomelabs/baseplate/pull/614) [`e0d690c`](https://github.com/halfdomelabs/baseplate/commit/e0d690c1e139f93a8ff60c9e0c90bc72cdf705a4) Thanks [@kingston](https://github.com/kingston)! - Add force overwrite mode for sync command

  Adds a `--force-overwrite` flag to the `baseplate sync` command that bypasses merge conflict detection and overwrites existing files with generated content without attempting to merge changes. When force overwrite is enabled, files matching patterns in `.baseplateignore` are automatically excluded from being overwritten to preserve user customizations.

  Also updates the diff command to load `.baseplateignore` patterns from each app directory instead of the base directory, providing more granular control over which files are ignored during diff operations.

- Updated dependencies []:
  - @baseplate-dev/utils@0.2.5

## 0.2.4

### Patch Changes

- Updated dependencies [[`ffe791f`](https://github.com/halfdomelabs/baseplate/commit/ffe791f6ab44e82c8481f3a18df9262dec71cff6)]:
  - @baseplate-dev/utils@0.2.4

## 0.2.3

### Patch Changes

- [#595](https://github.com/halfdomelabs/baseplate/pull/595) [`a506e88`](https://github.com/halfdomelabs/baseplate/commit/a506e88893bf395916ef3fbf6dd9dd7c0ff17acb) Thanks [@kingston](https://github.com/kingston)! - Add support for globs in onlyIfChanged command filter

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

- [#592](https://github.com/halfdomelabs/baseplate/pull/592) [`de9e1b4`](https://github.com/halfdomelabs/baseplate/commit/de9e1b4f3a8a7dcf6b962781a0aa589eb970c7a8) Thanks [@kingston](https://github.com/kingston)! - Fix up removeEmptyAncestorDirectories to handle nested directories correctly

- Updated dependencies []:
  - @baseplate-dev/utils@0.2.3

## 0.2.2

### Patch Changes

- [#591](https://github.com/halfdomelabs/baseplate/pull/591) [`f8c9284`](https://github.com/halfdomelabs/baseplate/commit/f8c9284752c12c6aab70481bf98e6fa402e61075) Thanks [@kingston](https://github.com/kingston)! - Ignore .template-metadata.json files when cleaning empty directories

- Updated dependencies [[`f8c9284`](https://github.com/halfdomelabs/baseplate/commit/f8c9284752c12c6aab70481bf98e6fa402e61075)]:
  - @baseplate-dev/utils@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.2.1

## 0.2.0

### Patch Changes

- [#568](https://github.com/halfdomelabs/baseplate/pull/568) [`06b4faf`](https://github.com/halfdomelabs/baseplate/commit/06b4fafaf3d2ed848d959a9911b9bfa26702d4a3) Thanks [@kingston](https://github.com/kingston)! - Enable the import-x/consistent-type-specifier-style rule to clean up type imports

- [#574](https://github.com/halfdomelabs/baseplate/pull/574) [`f5d7a6f`](https://github.com/halfdomelabs/baseplate/commit/f5d7a6f781b1799bb8ad197973e5cec04f869264) Thanks [@kingston](https://github.com/kingston)! - Refactored naming of project paths to output paths to be clearer about their meaning

- [#580](https://github.com/halfdomelabs/baseplate/pull/580) [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13) Thanks [@kingston](https://github.com/kingston)! - Fix issues with how renames are handled

- [#570](https://github.com/halfdomelabs/baseplate/pull/570) [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9) Thanks [@kingston](https://github.com/kingston)! - Add foundational infrastructure for Template Extractor V2 system

- [#580](https://github.com/halfdomelabs/baseplate/pull/580) [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13) Thanks [@kingston](https://github.com/kingston)! - Add command to list available generators with templates

- [#570](https://github.com/halfdomelabs/baseplate/pull/570) [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9) Thanks [@kingston](https://github.com/kingston)! - Implement phase 1 of reverse template generator v2

- Updated dependencies [[`06b4faf`](https://github.com/halfdomelabs/baseplate/commit/06b4fafaf3d2ed848d959a9911b9bfa26702d4a3), [`fd63554`](https://github.com/halfdomelabs/baseplate/commit/fd635544eb6df0385501f61f3e51bce554633458), [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9)]:
  - @baseplate-dev/utils@0.2.0

## 0.1.3

### Patch Changes

- [#562](https://github.com/halfdomelabs/baseplate/pull/562) [`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad) Thanks [@kingston](https://github.com/kingston)! - Switch to Typescript project references for building/watching project

- Updated dependencies [[`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad)]:
  - @baseplate-dev/utils@0.1.3

## 0.1.2

### Patch Changes

- [#560](https://github.com/halfdomelabs/baseplate/pull/560) [`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8) Thanks [@kingston](https://github.com/kingston)! - Add README files to all packages and plugins explaining their purpose within the Baseplate monorepo.

- Updated dependencies [[`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8)]:
  - @baseplate-dev/utils@0.1.2

## 0.1.1

### Patch Changes

- [#559](https://github.com/halfdomelabs/baseplate/pull/559) [`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b) Thanks [@kingston](https://github.com/kingston)! - Rename workspace to @baseplate-dev/\* and reset versions to 0.1.0

- [#557](https://github.com/halfdomelabs/baseplate/pull/557) [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad) Thanks [@kingston](https://github.com/kingston)! - Update LICENSE to modified MPL-2.0 license

- Updated dependencies [[`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b), [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad)]:
  - @baseplate-dev/utils@0.1.1
