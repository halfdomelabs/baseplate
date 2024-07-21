# @halfdomelabs/core-generators

## 0.9.2

### Patch Changes

- 02a4d70: Upgrade Sentry to 8.19.0 (https://docs.sentry.io/platforms/javascript/migration/v7-to-v8/)

## 0.9.1

### Patch Changes

- d8374b4: Upgrade tsc-alias to 1.8.10
- Updated dependencies [d8374b4]
  - @halfdomelabs/sync@0.7.5

## 0.9.0

### Minor Changes

- 7e95126: Replace 'jest' with 'vitest'.

### Patch Changes

- e32a926: Upgrade Node to 20.15.1
- bcc68c0: Upgrade Pothos to v4
- 94feb66: Upgrade Typescript to 5.4.4
- c0b42fc: Upgrade eslint and plugins to latest v8 versions
- e32a926: Upgrade PNPM to 9.5.0
- a6f01ea: Set up new plugin architecture and migrate storage plugin to new plugin architecture
- Updated dependencies [94feb66]
- Updated dependencies [a6f01ea]
  - @halfdomelabs/sync@0.7.4

## 0.8.0

### Minor Changes

- 3f95dc6: Upgrade PNPM to 9.1.2

### Patch Changes

- 3b720a2: Enable ETA templating from Typescript code files
- 082dfc3: Upgrade Zod to 3.23.8
- 082dfc3: Lay groundwork for initial plugin system with plugin discovery [in development]
- eda7e94: Fix expression replacement to support web app without auth
- 3f95dc6: Upgrade prettier to 3.2.5
- Updated dependencies [082dfc3]
- Updated dependencies [082dfc3]
  - @halfdomelabs/sync@0.7.3

## 0.7.6

### Patch Changes

- 9f33a18: Switch Vite projects to use ESM instead of CJS
  - @halfdomelabs/sync@0.7.2

## 0.7.5

### Patch Changes

- 988235d: Add fix for prettier plugin loading to use import instead of require

## 0.7.4

### Patch Changes

- 922f0bf9: Upgrade prettier plugins and fix bug when prettier plugins were not present
- 42beb73c: Upgrade local Docker Postgres to 16.2 and Redis to 7.2.4. See [Docker upgrade documentation](https://docs.hdlabs.dev/docs/guides/manual-upgrade-postgres) for upgrade instructions
  - @halfdomelabs/sync@0.7.2

## 0.7.3

### Patch Changes

- f69fbf50: Upgrade vite to 5.2.4 and vitest to 1.4.0
- 4c4cf8e5: Fix prettier plugins not being activated
- 4c4cf8e5: Added sorting of package.json with prettier
- Updated dependencies [f69fbf50]
  - @halfdomelabs/sync@0.7.2

## 0.7.2

### Patch Changes

- Updated dependencies [114717fe]
  - @halfdomelabs/sync@0.7.1

## 0.7.1

### Patch Changes

- 3da6a70: Upgrade to Node 20 and Typescript 5.2.2, cleaning up tsconfig setup
- Updated dependencies [63794f7]
- Updated dependencies [3da6a70]
  - @halfdomelabs/sync@0.7.0

## 0.7.0

### Minor Changes

- c314b65: Upgrade PNPM to 8.10.5
- c314b65: Upgrade to Node 18.18.2
- c314b65: Upgrade dependencies across the board to latest
- f24754d: Updated eslint/prettier rules

### Patch Changes

- f24754d: Upgrade to Node 18.17.1
- 47d84ca: Upgrade jest, Sentry, Postmark, and Stripe integrations to latest
- Updated dependencies [f24754d]
- Updated dependencies [f24754d]
  - @halfdomelabs/sync@0.6.0

## 0.6.1

### Patch Changes

- c4c38ec: Upgraded dependencies and remove gulp
- Updated dependencies [c4c38ec]
  - @halfdomelabs/sync@0.5.1

## 0.6.0

### Minor Changes

- 08a2746: Switch generation from yarn v1 to pnpm for faster build times (run pnpm import - https://medium.com/frontendweb/how-to-manage-multiple-nodejs-versions-with-pnpm-8bcce90abedb)

### Patch Changes

- 66ff670: Add ts-node back into dependencies to make ts-jest work
- Updated dependencies [08a2746]
  - @halfdomelabs/sync@0.5.0

## 0.5.0

### Minor Changes

- 0027b3d: Upgrade generated dependencies to get latest and greatest

### Patch Changes

- Updated dependencies [0027b3d]
- Updated dependencies [ba3f678]
  - @halfdomelabs/sync@0.4.0

## 0.4.2

### Patch Changes

- Updated dependencies [ce57ca0]
  - @halfdomelabs/sync@0.3.3

## 0.4.1

### Patch Changes

- 3f45e59: Fix changeset release process to build app before releasing
- Updated dependencies [3f45e59]
  - @halfdomelabs/sync@0.3.2

## 0.4.0

### Minor Changes

- c6893a5: Upgrade to Node 18.16 from Node 16.10

### Patch Changes

- c6893a5: Add --non-interactive to yarn install to fix yarn installation failures
- Updated dependencies [c6893a5]
  - @halfdomelabs/sync@0.3.1

## 0.3.0

### Minor Changes

- dcd86ed: Switch all packages to ESM
- dcd86ed: Switch to local version of prettier if version matches speeding up generation times considerably
- f7cb616: Switch to pnpm for package management

### Patch Changes

- Updated dependencies [dcd86ed]
- Updated dependencies [f7cb616]
  - @halfdomelabs/sync@0.3.0

## 0.2.1

### Patch Changes

- ec0218a: Upgrade tsc-alias tooling
- Updated dependencies [ec0218a]
  - @halfdomelabs/sync@0.2.1

## 0.2.0

### Minor Changes

- 5f2d7d8: Prepare Baseplate packages for release

### Patch Changes

- Updated dependencies [5f2d7d8]
  - @halfdomelabs/sync@0.2.0
