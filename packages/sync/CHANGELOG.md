# @halfdomelabs/sync

## 0.9.0

### Minor Changes

- [#428](https://github.com/halfdomelabs/baseplate/pull/428) [`5507eb7`](https://github.com/halfdomelabs/baseplate/commit/5507eb77d5413d3b87fa50988a6e4a1d58d78a14) Thanks [@kingston](https://github.com/kingston)! - Refactor output file writing and support file IDs to allow rename operations

### Patch Changes

- Updated dependencies [[`5507eb7`](https://github.com/halfdomelabs/baseplate/commit/5507eb77d5413d3b87fa50988a6e4a1d58d78a14)]:
  - @halfdomelabs/utils@0.1.2

## 0.8.0

### Minor Changes

- [#418](https://github.com/halfdomelabs/baseplate/pull/418) [`71e3257`](https://github.com/halfdomelabs/baseplate/commit/71e325718e71aabffc02108ad6e97aa7f99729c9) Thanks [@kingston](https://github.com/kingston)! - Refactor sync package for better code organization

- [#414](https://github.com/halfdomelabs/baseplate/pull/414) [`bc756fd`](https://github.com/halfdomelabs/baseplate/commit/bc756fd5ec6c27f0b4883ca778fbbf2bc63106ed) Thanks [@kingston](https://github.com/kingston)! - Introduce concept of scopes for provider dependency resolution to replace hoisting/peer/parent resolution

- [#420](https://github.com/halfdomelabs/baseplate/pull/420) [`f0ee4e0`](https://github.com/halfdomelabs/baseplate/commit/f0ee4e07fc9d40947f319efb788f7fb596848231) Thanks [@kingston](https://github.com/kingston)! - Refactor generators to pass instantiated generator directly to engine instead of intermediate JSON. Note: This means deleting any descriptor JSON files from the baseplate folder for each app as they are no longer used.

### Patch Changes

- [#402](https://github.com/halfdomelabs/baseplate/pull/402) [`48bda89`](https://github.com/halfdomelabs/baseplate/commit/48bda899b7b4158ba6ec58118edacc3b61ddb043) Thanks [@kingston](https://github.com/kingston)! - Support generation on Windows platforms

- [#416](https://github.com/halfdomelabs/baseplate/pull/416) [`b18263c`](https://github.com/halfdomelabs/baseplate/commit/b18263c1a06a74c9c5456b1efb0d7171e3b747cc) Thanks [@kingston](https://github.com/kingston)! - Refactor generators to use createGeneratorsWithTasks instead of createGeneratorsWithChildren

- [#405](https://github.com/halfdomelabs/baseplate/pull/405) [`17fc44f`](https://github.com/halfdomelabs/baseplate/commit/17fc44f3c2d232c9712ed43a27439594b41ea139) Thanks [@kingston](https://github.com/kingston)! - Delete empty folders when deleting files from codebase

- [#412](https://github.com/halfdomelabs/baseplate/pull/412) [`a09b91f`](https://github.com/halfdomelabs/baseplate/commit/a09b91f2d1ebd4c91653bdc2a89d03947d1b06da) Thanks [@kingston](https://github.com/kingston)! - Add ability to generate a graph visualization of generator steps with cytoscape.js

- [#419](https://github.com/halfdomelabs/baseplate/pull/419) [`9f34f54`](https://github.com/halfdomelabs/baseplate/commit/9f34f54d6b6c9762f5237000c83aa9959116a282) Thanks [@kingston](https://github.com/kingston)! - Change monorepo tooling to Turborepo from NX for easier caching

- [#412](https://github.com/halfdomelabs/baseplate/pull/412) [`a09b91f`](https://github.com/halfdomelabs/baseplate/commit/a09b91f2d1ebd4c91653bdc2a89d03947d1b06da) Thanks [@kingston](https://github.com/kingston)! - refactor: Allow optional returns from run function in generator

- [#410](https://github.com/halfdomelabs/baseplate/pull/410) [`62acb20`](https://github.com/halfdomelabs/baseplate/commit/62acb202ba44cf4bdbafdf5643d115c1811719ff) Thanks [@kingston](https://github.com/kingston)! - Refactor merging to use merging algorithms to allow broader flexibility:

  - Introduce merge algorithms (diff3, JSON, simple diff)
  - Add composite merge algorithm for chaining multiple merge strategies
  - Enhance configuration options to support custom merge algorithms

- [#414](https://github.com/halfdomelabs/baseplate/pull/414) [`bc756fd`](https://github.com/halfdomelabs/baseplate/commit/bc756fd5ec6c27f0b4883ca778fbbf2bc63106ed) Thanks [@kingston](https://github.com/kingston)! - Refactor dependency map to use global IDs instead of internal generator IDs

- [#413](https://github.com/halfdomelabs/baseplate/pull/413) [`e76c097`](https://github.com/halfdomelabs/baseplate/commit/e76c09721852d1a367ca4867f5e6abc350684b0c) Thanks [@kingston](https://github.com/kingston)! - refactor: Remove deprecated export dependencies

## 0.7.12

### Patch Changes

- 6ca94da: Upgrade Zod to 3.24.1
- 354f4c9: [internal] Refactor formatter provider to become part of generator output

## 0.7.11

### Patch Changes

- 77d9399: Upgrade ESLint to v9 and use updated Linter configurations

## 0.7.10

### Patch Changes

- 416f0941: Switch to ESM module resolution for backend (before syncing, run `pnpx migrate-esm-imports src baseplate/.clean` on your backend folder to minimize merge errors)

## 0.7.9

### Patch Changes

- 92654962: Upgrade Typescript to 5.5.4 using PNPM catalog
- 92c1401f: Upgrade vitest to 2.1.1 and vite to 5.4.7 and @types/react to 18.3.8
- 8cb0ef35: Upgrade assorted dependencies

## 0.7.8

### Patch Changes

- f44674a: Fix propagation of post-generate commands error logs to command output

## 0.7.7

### Patch Changes

- 3dbb454: Upgrade execa package to 9.3.0

## 0.7.6

### Patch Changes

- ddbbead: Upgrade vitest to 2.0.3

## 0.7.5

### Patch Changes

- d8374b4: Upgrade tsc-alias to 1.8.10

## 0.7.4

### Patch Changes

- 94feb66: Upgrade Typescript to 5.4.4
- a6f01ea: Set up new plugin architecture and migrate storage plugin to new plugin architecture

## 0.7.3

### Patch Changes

- 082dfc3: Upgrade Zod to 3.23.8
- 082dfc3: Lay groundwork for initial plugin system with plugin discovery [in development]

## 0.7.2

### Patch Changes

- f69fbf50: Upgrade vite to 5.2.4 and vitest to 1.4.0

## 0.7.1

### Patch Changes

- 114717fe: Add prepend to non overwriteable map

## 0.7.0

### Minor Changes

- 63794f7: Adds a 5m timeout to project generation

### Patch Changes

- 3da6a70: Upgrade to Node 20 and Typescript 5.2.2, cleaning up tsconfig setup

## 0.6.0

### Minor Changes

- f24754d: Updated eslint/prettier rules

### Patch Changes

- f24754d: Upgrade to Node 18.17.1

## 0.5.1

### Patch Changes

- c4c38ec: Upgraded dependencies and remove gulp

## 0.5.0

### Minor Changes

- 08a2746: Switch generation from yarn v1 to pnpm for faster build times (run pnpm import - https://medium.com/frontendweb/how-to-manage-multiple-nodejs-versions-with-pnpm-8bcce90abedb)

## 0.4.0

### Minor Changes

- 0027b3d: Upgrade generated dependencies to get latest and greatest

### Patch Changes

- ba3f678: Add ability to order post write commands so yarn install runs first

## 0.3.3

### Patch Changes

- ce57ca0: Don't write files that match their clean version

## 0.3.2

### Patch Changes

- 3f45e59: Fix changeset release process to build app before releasing

## 0.3.1

### Patch Changes

- c6893a5: Switch to execa for running commands instead of child_process

## 0.3.0

### Minor Changes

- dcd86ed: Switch all packages to ESM
- f7cb616: Switch to pnpm for package management

## 0.2.1

### Patch Changes

- ec0218a: Upgrade tsc-alias tooling

## 0.2.0

### Minor Changes

- 5f2d7d8: Prepare Baseplate packages for release
