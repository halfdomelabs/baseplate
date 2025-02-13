# @halfdomelabs/project-builder-server

## 0.5.2

### Patch Changes

- [#435](https://github.com/halfdomelabs/baseplate/pull/435) [`3b83763`](https://github.com/halfdomelabs/baseplate/commit/3b837636d225db0bb729fad05536ad9df4dfb1d6) Thanks [@kingston](https://github.com/kingston)! - Rewrite saving/syncing logic to clean up flows for parsing and saving project definition

- Updated dependencies [[`3b83763`](https://github.com/halfdomelabs/baseplate/commit/3b837636d225db0bb729fad05536ad9df4dfb1d6), [`1bc1674`](https://github.com/halfdomelabs/baseplate/commit/1bc167442e649490b22d3afc6c508fcd23a194a4), [`3b83763`](https://github.com/halfdomelabs/baseplate/commit/3b837636d225db0bb729fad05536ad9df4dfb1d6), [`2e5e7b4`](https://github.com/halfdomelabs/baseplate/commit/2e5e7b4b9fd1308ee06e5c83ac54fef7926685ab)]:
  - @halfdomelabs/project-builder-lib@0.9.2
  - @halfdomelabs/fastify-generators@0.11.2
  - @halfdomelabs/react-generators@0.9.2
  - @halfdomelabs/core-generators@0.10.2

## 0.5.1

### Patch Changes

- [#428](https://github.com/halfdomelabs/baseplate/pull/428) [`5507eb7`](https://github.com/halfdomelabs/baseplate/commit/5507eb77d5413d3b87fa50988a6e4a1d58d78a14) Thanks [@kingston](https://github.com/kingston)! - Refactor output file writing and support file IDs to allow rename operations

- Updated dependencies [[`5507eb7`](https://github.com/halfdomelabs/baseplate/commit/5507eb77d5413d3b87fa50988a6e4a1d58d78a14), [`5507eb7`](https://github.com/halfdomelabs/baseplate/commit/5507eb77d5413d3b87fa50988a6e4a1d58d78a14)]:
  - @halfdomelabs/sync@0.9.0
  - @halfdomelabs/fastify-generators@0.11.1
  - @halfdomelabs/react-generators@0.9.1
  - @halfdomelabs/core-generators@0.10.1
  - @halfdomelabs/utils@0.1.2
  - @halfdomelabs/project-builder-lib@0.9.1

## 0.5.0

### Minor Changes

- [#420](https://github.com/halfdomelabs/baseplate/pull/420) [`f0ee4e0`](https://github.com/halfdomelabs/baseplate/commit/f0ee4e07fc9d40947f319efb788f7fb596848231) Thanks [@kingston](https://github.com/kingston)! - Refactor generators to pass instantiated generator directly to engine instead of intermediate JSON. Note: This means deleting any descriptor JSON files from the baseplate folder for each app as they are no longer used.

### Patch Changes

- [#402](https://github.com/halfdomelabs/baseplate/pull/402) [`48bda89`](https://github.com/halfdomelabs/baseplate/commit/48bda899b7b4158ba6ec58118edacc3b61ddb043) Thanks [@kingston](https://github.com/kingston)! - Support generation on Windows platforms

- [#405](https://github.com/halfdomelabs/baseplate/pull/405) [`17fc44f`](https://github.com/halfdomelabs/baseplate/commit/17fc44f3c2d232c9712ed43a27439594b41ea139) Thanks [@kingston](https://github.com/kingston)! - Delete empty folders when deleting files from codebase

- [#414](https://github.com/halfdomelabs/baseplate/pull/414) [`bc756fd`](https://github.com/halfdomelabs/baseplate/commit/bc756fd5ec6c27f0b4883ca778fbbf2bc63106ed) Thanks [@kingston](https://github.com/kingston)! - Introduce concept of scopes for provider dependency resolution to replace hoisting/peer/parent resolution

- [#412](https://github.com/halfdomelabs/baseplate/pull/412) [`a09b91f`](https://github.com/halfdomelabs/baseplate/commit/a09b91f2d1ebd4c91653bdc2a89d03947d1b06da) Thanks [@kingston](https://github.com/kingston)! - Add ability to generate a graph visualization of generator steps with cytoscape.js

- [#419](https://github.com/halfdomelabs/baseplate/pull/419) [`9f34f54`](https://github.com/halfdomelabs/baseplate/commit/9f34f54d6b6c9762f5237000c83aa9959116a282) Thanks [@kingston](https://github.com/kingston)! - Change monorepo tooling to Turborepo from NX for easier caching

- [#424](https://github.com/halfdomelabs/baseplate/pull/424) [`6a317cc`](https://github.com/halfdomelabs/baseplate/commit/6a317cc437fd53c9488067811bade99b167072f5) Thanks [@kingston](https://github.com/kingston)! - Replace lodash/ramda with es-tookit

- Updated dependencies [[`71e3257`](https://github.com/halfdomelabs/baseplate/commit/71e325718e71aabffc02108ad6e97aa7f99729c9), [`f33c7d3`](https://github.com/halfdomelabs/baseplate/commit/f33c7d33d883e36aa18ad5e1976bf737d7f84897), [`48bda89`](https://github.com/halfdomelabs/baseplate/commit/48bda899b7b4158ba6ec58118edacc3b61ddb043), [`cd92861`](https://github.com/halfdomelabs/baseplate/commit/cd92861d764380264dcc7d480407edf618421e70), [`6a317cc`](https://github.com/halfdomelabs/baseplate/commit/6a317cc437fd53c9488067811bade99b167072f5), [`70c6478`](https://github.com/halfdomelabs/baseplate/commit/70c6478dfe7a5cfe19200b838c97327cd2dc0757), [`cd92861`](https://github.com/halfdomelabs/baseplate/commit/cd92861d764380264dcc7d480407edf618421e70), [`b18263c`](https://github.com/halfdomelabs/baseplate/commit/b18263c1a06a74c9c5456b1efb0d7171e3b747cc), [`17fc44f`](https://github.com/halfdomelabs/baseplate/commit/17fc44f3c2d232c9712ed43a27439594b41ea139), [`bc756fd`](https://github.com/halfdomelabs/baseplate/commit/bc756fd5ec6c27f0b4883ca778fbbf2bc63106ed), [`a09b91f`](https://github.com/halfdomelabs/baseplate/commit/a09b91f2d1ebd4c91653bdc2a89d03947d1b06da), [`09243e5`](https://github.com/halfdomelabs/baseplate/commit/09243e511eefa65ce0809ec8b9228a74f690cdf6), [`9f34f54`](https://github.com/halfdomelabs/baseplate/commit/9f34f54d6b6c9762f5237000c83aa9959116a282), [`a09b91f`](https://github.com/halfdomelabs/baseplate/commit/a09b91f2d1ebd4c91653bdc2a89d03947d1b06da), [`62acb20`](https://github.com/halfdomelabs/baseplate/commit/62acb202ba44cf4bdbafdf5643d115c1811719ff), [`bc756fd`](https://github.com/halfdomelabs/baseplate/commit/bc756fd5ec6c27f0b4883ca778fbbf2bc63106ed), [`f0ee4e0`](https://github.com/halfdomelabs/baseplate/commit/f0ee4e07fc9d40947f319efb788f7fb596848231), [`09243e5`](https://github.com/halfdomelabs/baseplate/commit/09243e511eefa65ce0809ec8b9228a74f690cdf6), [`6a317cc`](https://github.com/halfdomelabs/baseplate/commit/6a317cc437fd53c9488067811bade99b167072f5), [`e76c097`](https://github.com/halfdomelabs/baseplate/commit/e76c09721852d1a367ca4867f5e6abc350684b0c), [`70c6478`](https://github.com/halfdomelabs/baseplate/commit/70c6478dfe7a5cfe19200b838c97327cd2dc0757)]:
  - @halfdomelabs/sync@0.8.0
  - @halfdomelabs/core-generators@0.10.0
  - @halfdomelabs/fastify-generators@0.11.0
  - @halfdomelabs/project-builder-lib@0.9.0
  - @halfdomelabs/react-generators@0.9.0
  - @halfdomelabs/utils@0.1.1

## 0.4.15

### Patch Changes

- 6ca94da: Upgrade Zod to 3.24.1
- Updated dependencies [6ca94da]
- Updated dependencies [354f4c9]
- Updated dependencies [98518dd]
  - @halfdomelabs/project-builder-lib@0.8.13
  - @halfdomelabs/sync@0.7.12

## 0.4.14

### Patch Changes

- cc837f9: Fix get/list being independently enabled for mutations
- 77d9399: Upgrade ESLint to v9 and use updated Linter configurations
- d1b05af: Upgrade Fastify and associated packages to v5 versions
- Updated dependencies [77d9399]
  - @halfdomelabs/project-builder-lib@0.8.12
  - @halfdomelabs/sync@0.7.11

## 0.4.13

### Patch Changes

- Updated dependencies [416f0941]
  - @halfdomelabs/sync@0.7.10
  - @halfdomelabs/project-builder-lib@0.8.11

## 0.4.12

### Patch Changes

- 95d28283: fix: Fix embedded CRUD ID field rendering

## 0.4.11

### Patch Changes

- f92a4670: Add useBlockUnsavedChangesNavigate hook to allow users to save before proceeding
- 18ef42fe: Upgrade pino to 9.4.0 and pino-pretty to 11.2.2
- 37006225: Update UI for model editor
- 92654962: Upgrade Typescript to 5.5.4 using PNPM catalog
- 92c1401f: Upgrade vitest to 2.1.1 and vite to 5.4.7 and @types/react to 18.3.8
- 8cb0ef35: Upgrade assorted dependencies
- Updated dependencies [03f3df6a]
- Updated dependencies [f92a4670]
- Updated dependencies [32021f09]
- Updated dependencies [a6e3fd96]
- Updated dependencies [d447024b]
- Updated dependencies [37006225]
- Updated dependencies [c835165c]
- Updated dependencies [92654962]
- Updated dependencies [92c1401f]
- Updated dependencies [8cb0ef35]
- Updated dependencies [1bd25964]
  - @halfdomelabs/project-builder-lib@0.8.10
  - @halfdomelabs/sync@0.7.9

## 0.4.10

### Patch Changes

- 95105c3: Fix auto-generated JSON to match project definition input
- 1dc5a63: Rename project.json to project-definition.json
- e2bc878: Refactor initial generation to log output correctly
- c86aaaf: Ensure schema does not get generated if no authorize
- Updated dependencies [f44674a]
  - @halfdomelabs/sync@0.7.8
  - @halfdomelabs/project-builder-lib@0.8.9

## 0.4.9

### Patch Changes

- 3dbb454: Introduce new @halfdomelabs/project-builder-common library to contain all default plugins and generators
- 3dbb454: Refactor project builder compiler not to strip objects from compiled output
- Updated dependencies [3dbb454]
- Updated dependencies [3dbb454]
  - @halfdomelabs/project-builder-lib@0.8.8
  - @halfdomelabs/sync@0.7.7

## 0.4.8

### Patch Changes

- 3256d45: Upgrade fastify to 4.28.1
- Updated dependencies [b06f805]
  - @halfdomelabs/project-builder-lib@0.8.7

## 0.4.7

### Patch Changes

- Updated dependencies [a6a6653]
  - @halfdomelabs/project-builder-lib@0.8.6

## 0.4.6

### Patch Changes

- ddbbead: Upgrade vitest to 2.0.3
- Updated dependencies [ddbbead]
  - @halfdomelabs/project-builder-lib@0.8.5
  - @halfdomelabs/sync@0.7.6

## 0.4.5

### Patch Changes

- Updated dependencies [ab0b4f0]
  - @halfdomelabs/project-builder-lib@0.8.4

## 0.4.4

### Patch Changes

- 02a4d70: Upgrade Sentry to 8.19.0 (https://docs.sentry.io/platforms/javascript/migration/v7-to-v8/)

## 0.4.3

### Patch Changes

- 64bc313: Fix web entry target sourcing to source plugins from source folder instead of dist
- Updated dependencies [64bc313]
  - @halfdomelabs/project-builder-lib@0.8.3

## 0.4.2

### Patch Changes

- b86ae48: Fix loading of web plugin paths
- Updated dependencies [b86ae48]
  - @halfdomelabs/project-builder-lib@0.8.2

## 0.4.1

### Patch Changes

- d8374b4: Upgrade tsc-alias to 1.8.10
- Updated dependencies [d8374b4]
  - @halfdomelabs/project-builder-lib@0.8.1
  - @halfdomelabs/sync@0.7.5

## 0.4.0

### Minor Changes

- a6f01ea: Set up new plugin architecture and migrate storage plugin to new plugin architecture
- dafb793: Generate Fastify backend README

### Patch Changes

- 94feb66: Upgrade Typescript to 5.4.4
- 7e95126: Replace 'jest' with 'vitest'.
- Updated dependencies [0cadfee]
- Updated dependencies [94feb66]
- Updated dependencies [c0b42fc]
- Updated dependencies [a6f01ea]
  - @halfdomelabs/project-builder-lib@0.8.0
  - @halfdomelabs/sync@0.7.4

## 0.3.7

### Patch Changes

- Updated dependencies [6f7b930]
  - @halfdomelabs/project-builder-lib@0.7.6

## 0.3.6

### Patch Changes

- 3b720a2: Prevent projects from being generated for the same folder
- 082dfc3: Upgrade Zod to 3.23.8
- 082dfc3: Lay groundwork for initial plugin system with plugin discovery [in development]
- Updated dependencies [082dfc3]
- Updated dependencies [082dfc3]
  - @halfdomelabs/project-builder-lib@0.7.5
  - @halfdomelabs/sync@0.7.3

## 0.3.5

### Patch Changes

- Updated dependencies [377b433]
  - @halfdomelabs/project-builder-lib@0.7.4
  - @halfdomelabs/sync@0.7.2

## 0.3.4

### Patch Changes

- 6b368f5: Rename project config to project definition
- 8046390: Refactor graceful shutdown to use console.info instead of fastify.log
- Updated dependencies [6b368f5]
  - @halfdomelabs/project-builder-lib@0.7.3

## 0.3.3

### Patch Changes

- f69fbf50: Upgrade vite to 5.2.4 and vitest to 1.4.0
- Updated dependencies [f69fbf50]
- Updated dependencies [4c4cf8e5]
  - @halfdomelabs/project-builder-lib@0.7.2
  - @halfdomelabs/sync@0.7.2

## 0.3.2

### Patch Changes

- Updated dependencies [114717fe]
  - @halfdomelabs/sync@0.7.1

## 0.3.1

### Patch Changes

- Updated dependencies [1e30f98b]
- Updated dependencies [1e30f98b]
  - @halfdomelabs/project-builder-lib@0.7.1

## 0.3.0

### Minor Changes

- ae358f50: Switch over project builder to new reference system

### Patch Changes

- Updated dependencies [0583ca1e]
- Updated dependencies [fdd80b5a]
- Updated dependencies [0ef0915d]
- Updated dependencies [8c0a2d5b]
- Updated dependencies [ae358f50]
  - @halfdomelabs/project-builder-lib@0.7.0
  - @halfdomelabs/sync@0.7.0

## 0.2.0

### Minor Changes

- bab0c31: Change to TRPC for communication instead of REST

### Patch Changes

- Updated dependencies [63794f7]
- Updated dependencies [9d0005b]
- Updated dependencies [3da6a70]
  - @halfdomelabs/sync@0.7.0
  - @halfdomelabs/project-builder-lib@0.6.1
