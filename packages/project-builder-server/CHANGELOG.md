# @halfdomelabs/project-builder-server

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
