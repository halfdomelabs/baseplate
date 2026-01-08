# @baseplate-dev/create-project

## 0.5.0

### Patch Changes

- [#734](https://github.com/halfdomelabs/baseplate/pull/734) [`8bfc742`](https://github.com/halfdomelabs/baseplate/commit/8bfc742b8a93393a5539babfd11b97a88ee9c39e) Thanks [@kingston](https://github.com/kingston)! - Upgrade vitest to 4.0.16
  - vitest: 3.2.4 → 4.0.16
  - @vitest/eslint-plugin: 1.3.4 → 1.6.5

  Breaking changes addressed:
  - Updated `UserConfig` type to `ViteUserConfig` in vitest config files
  - Fixed mock type annotations for vitest 4.0 compatibility

- Updated dependencies [[`97bd14e`](https://github.com/halfdomelabs/baseplate/commit/97bd14e381206b54e55c22264d1d406e83146146), [`c7d373e`](https://github.com/halfdomelabs/baseplate/commit/c7d373ebaaeda2522515fdaeae0d37d0cd9ce7fe), [`397018b`](https://github.com/halfdomelabs/baseplate/commit/397018b8c30949f75734369b58c67d7afcc424a9), [`8bfc742`](https://github.com/halfdomelabs/baseplate/commit/8bfc742b8a93393a5539babfd11b97a88ee9c39e)]:
  - @baseplate-dev/project-builder-lib@0.5.0
  - @baseplate-dev/project-builder-server@0.5.0
  - @baseplate-dev/sync@0.5.0
  - @baseplate-dev/project-builder-cli@0.5.0
  - @baseplate-dev/utils@0.5.0

## 0.4.4

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/project-builder-server@0.4.4
  - @baseplate-dev/project-builder-cli@0.4.4
  - @baseplate-dev/project-builder-lib@0.4.4
  - @baseplate-dev/sync@0.4.4
  - @baseplate-dev/utils@0.4.4

## 0.4.3

### Patch Changes

- [#715](https://github.com/halfdomelabs/baseplate/pull/715) [`68ab5bd`](https://github.com/halfdomelabs/baseplate/commit/68ab5bdbc98a0b4bbc46059bfabd84666a2ab18b) Thanks [@kingston](https://github.com/kingston)! - Refactor create-project to use sync engine for generating root directory files

- Updated dependencies [[`9638baf`](https://github.com/halfdomelabs/baseplate/commit/9638baf19fa0f68bed961daa0fe889822246c11a), [`68ab5bd`](https://github.com/halfdomelabs/baseplate/commit/68ab5bdbc98a0b4bbc46059bfabd84666a2ab18b), [`83e4e7f`](https://github.com/halfdomelabs/baseplate/commit/83e4e7f60adf67480cebb4ff419c015ff282010d)]:
  - @baseplate-dev/project-builder-server@0.4.3
  - @baseplate-dev/project-builder-cli@0.4.3
  - @baseplate-dev/project-builder-lib@0.4.3
  - @baseplate-dev/sync@0.4.3
  - @baseplate-dev/utils@0.4.3

## 0.4.2

### Patch Changes

- [#697](https://github.com/halfdomelabs/baseplate/pull/697) [`11fa86f`](https://github.com/halfdomelabs/baseplate/commit/11fa86fb8e7a209175f132b1b3d59cd24cf13d54) Thanks [@kingston](https://github.com/kingston)! - Ignore \*.map files from built output in package.json

- Updated dependencies [[`11fa86f`](https://github.com/halfdomelabs/baseplate/commit/11fa86fb8e7a209175f132b1b3d59cd24cf13d54), [`4be6c7d`](https://github.com/halfdomelabs/baseplate/commit/4be6c7dc7d900c37585b93cf5bb7198de6a41f1f)]:
  - @baseplate-dev/project-builder-cli@0.4.2
  - @baseplate-dev/utils@0.4.2

## 0.4.1

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/project-builder-cli@0.4.1
  - @baseplate-dev/utils@0.4.1

## 0.4.0

### Patch Changes

- [#679](https://github.com/halfdomelabs/baseplate/pull/679) [`b1634b0`](https://github.com/halfdomelabs/baseplate/commit/b1634b08904e6d862fe1a3a377bfe21b455ece5c) Thanks [@kingston](https://github.com/kingston)! - Upgrade pnpm to 10.18.3

- Updated dependencies [[`d324059`](https://github.com/halfdomelabs/baseplate/commit/d3240594e1c2bc2348eb1a7e8938f97ea5f55d22), [`c3c2a00`](https://github.com/halfdomelabs/baseplate/commit/c3c2a001d57a21f76e064af55941a43bedf26f18), [`57e15c0`](https://github.com/halfdomelabs/baseplate/commit/57e15c085099508898756385661df9cf54108466)]:
  - @baseplate-dev/project-builder-cli@0.4.0
  - @baseplate-dev/utils@0.4.0

## 0.3.8

### Patch Changes

- [#668](https://github.com/halfdomelabs/baseplate/pull/668) [`b208178`](https://github.com/halfdomelabs/baseplate/commit/b20817823d66fde1dfc1e3472ceedc2e6afd14c2) Thanks [@kingston](https://github.com/kingston)! - Upgrade PNPM to 10.16.1 and add minimumReleaseAge security setting
  - Upgraded PNPM from 10.15.0 to 10.16.1 across all package.json files
  - Added minimumReleaseAge=1440 (24 hours) to .npmrc files to delay installation of newly released dependencies
  - This security setting reduces risk of installing compromised packages by ensuring only packages released at least one day ago can be installed
  - Updated project creation template to include the new security setting for all new Baseplate projects

- Updated dependencies []:
  - @baseplate-dev/project-builder-cli@0.3.8
  - @baseplate-dev/utils@0.3.8

## 0.3.7

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/project-builder-cli@0.3.7
  - @baseplate-dev/utils@0.3.7

## 0.3.6

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/project-builder-cli@0.3.6
  - @baseplate-dev/utils@0.3.6

## 0.3.5

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/project-builder-cli@0.3.5
  - @baseplate-dev/utils@0.3.5

## 0.3.4

### Patch Changes

- [#644](https://github.com/halfdomelabs/baseplate/pull/644) [`fb35013`](https://github.com/halfdomelabs/baseplate/commit/fb35013bb5e5f990ed4e21a1f54f2192be7d3df6) Thanks [@kingston](https://github.com/kingston)! - Link project-builder-cli directly instead of fetching from npm registry
  - Add @baseplate-dev/project-builder-cli as workspace dependency
  - Ensure version consistency between create-project and CLI

- [#643](https://github.com/halfdomelabs/baseplate/pull/643) [`7d9e6d0`](https://github.com/halfdomelabs/baseplate/commit/7d9e6d01e0a9920cee4c4d499beeffc1c663494a) Thanks [@kingston](https://github.com/kingston)! - Upgrade to TypeScript 5.8 with erasable syntax only mode

  This upgrade modernizes the codebase with TypeScript 5.8, enables erasable syntax only mode for better performance, and updates runtime dependencies.

  **Key Changes:**
  - Upgraded TypeScript to version 5.8
  - Enabled `erasableSyntaxOnly` compiler option for improved build performance
  - Updated Node.js requirement to 22.18
  - Updated PNPM requirement to 10.15
  - Fixed parameter property syntax to be compatible with erasable syntax only mode

- Updated dependencies [[`783a495`](https://github.com/halfdomelabs/baseplate/commit/783a495411e76d28b781bbe0af5f57300a282353), [`f39ce15`](https://github.com/halfdomelabs/baseplate/commit/f39ce158c37d23472db96a42daccdc80f6d48f54), [`7d9e6d0`](https://github.com/halfdomelabs/baseplate/commit/7d9e6d01e0a9920cee4c4d499beeffc1c663494a)]:
  - @baseplate-dev/project-builder-cli@0.3.4
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

- Updated dependencies []:
  - @baseplate-dev/utils@0.3.0

## 0.2.6

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.2.6

## 0.2.5

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.2.5

## 0.2.4

### Patch Changes

- Updated dependencies [[`ffe791f`](https://github.com/halfdomelabs/baseplate/commit/ffe791f6ab44e82c8481f3a18df9262dec71cff6)]:
  - @baseplate-dev/utils@0.2.4

## 0.2.3

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.2.3

## 0.2.2

### Patch Changes

- Updated dependencies [[`f8c9284`](https://github.com/halfdomelabs/baseplate/commit/f8c9284752c12c6aab70481bf98e6fa402e61075)]:
  - @baseplate-dev/utils@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.2.1

## 0.2.0

### Patch Changes

- Updated dependencies [[`06b4faf`](https://github.com/halfdomelabs/baseplate/commit/06b4fafaf3d2ed848d959a9911b9bfa26702d4a3), [`fd63554`](https://github.com/halfdomelabs/baseplate/commit/fd635544eb6df0385501f61f3e51bce554633458), [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9)]:
  - @baseplate-dev/utils@0.2.0

## 0.1.3

### Patch Changes

- [#562](https://github.com/halfdomelabs/baseplate/pull/562) [`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad) Thanks [@kingston](https://github.com/kingston)! - Switch to Typescript project references for building/watching project

- Updated dependencies [[`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad)]:
  - @baseplate-dev/utils@0.1.3

## 0.1.2

### Patch Changes

- [#560](https://github.com/halfdomelabs/baseplate/pull/560) [`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8) Thanks [@kingston](https://github.com/kingston)! - Remove NPM token requirement as Baseplate is now open source. The create-project command no longer prompts for an NPM token and related template files have been simplified.

- Updated dependencies [[`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8)]:
  - @baseplate-dev/utils@0.1.2

## 0.1.1

### Patch Changes

- [#559](https://github.com/halfdomelabs/baseplate/pull/559) [`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b) Thanks [@kingston](https://github.com/kingston)! - Rename workspace to @baseplate-dev/\* and reset versions to 0.1.0

- [#557](https://github.com/halfdomelabs/baseplate/pull/557) [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad) Thanks [@kingston](https://github.com/kingston)! - Update LICENSE to modified MPL-2.0 license

- Updated dependencies [[`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b), [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad)]:
  - @baseplate-dev/utils@0.1.1
