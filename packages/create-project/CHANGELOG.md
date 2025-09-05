# @baseplate-dev/create-project

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
