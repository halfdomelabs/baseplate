# @halfdomelabs/sync

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
