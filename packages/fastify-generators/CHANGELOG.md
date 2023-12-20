# @halfdomelabs/fastify-generators

## 0.8.0

### Minor Changes

- 9d0005b: Improve Sentry error and transaction reporting
- 8efd325: Bumped tsx version

### Patch Changes

- 9d0005b: Add axios utility to support better stack traces/error info for Axios
- e65aca2: Upgrade Pothos to 3.40.1
- 70c31ab: Upgrade Postmark to 4.0.2 and Sendgrid to 8.1.0
- 3da6a70: Upgrade to Node 20 and Typescript 5.2.2, cleaning up tsconfig setup
- Updated dependencies [63794f7]
- Updated dependencies [3da6a70]
  - @halfdomelabs/sync@0.7.0
  - @halfdomelabs/core-generators@0.7.1

## 0.7.0

### Minor Changes

- c314b65: Upgrade to Node 18.18.2
- c314b65: Upgrade dependencies across the board to latest
- f24754d: Updated eslint/prettier rules

### Patch Changes

- ea1f862: Fix Sentry plugin to avoid stacking event processors
- f24754d: Upgrade to Node 18.17.1
- 47d84ca: Upgrade jest, Sentry, Postmark, and Stripe integrations to latest
- e2fb218: Log userId in global logger for requests
- f24754d: Upgrade to Typescript 5.1
- cd045cc: Upgrade to Prisma 5.6.0
- Updated dependencies [c314b65]
- Updated dependencies [c314b65]
- Updated dependencies [f24754d]
- Updated dependencies [47d84ca]
- Updated dependencies [c314b65]
- Updated dependencies [f24754d]
  - @halfdomelabs/core-generators@0.7.0
  - @halfdomelabs/sync@0.6.0

## 0.6.2

### Patch Changes

- 8cca488: Fix mutation generation for compound IDs

## 0.6.1

### Patch Changes

- c4c38ec: Upgraded dependencies and remove gulp
- 29a2712: Fix service function generation to account non-id primary keys
- Updated dependencies [c4c38ec]
  - @halfdomelabs/core-generators@0.6.1
  - @halfdomelabs/sync@0.5.1

## 0.6.0

### Minor Changes

- 08a2746: Switch generation from yarn v1 to pnpm for faster build times (run pnpm import - https://medium.com/frontendweb/how-to-manage-multiple-nodejs-versions-with-pnpm-8bcce90abedb)
- 4673336: Change service functions to take in input object with query info

### Patch Changes

- Updated dependencies [08a2746]
- Updated dependencies [66ff670]
  - @halfdomelabs/core-generators@0.6.0
  - @halfdomelabs/sync@0.5.0

## 0.5.1

### Patch Changes

- 7fdeeb5: Fix up a lint error with latest generation

## 0.5.0

### Minor Changes

- 0027b3d: Upgrade generated dependencies to get latest and greatest
- 97b8e6a: Use tsx instead of node-dev

### Patch Changes

- Updated dependencies [0027b3d]
- Updated dependencies [ba3f678]
  - @halfdomelabs/core-generators@0.5.0
  - @halfdomelabs/sync@0.4.0

## 0.4.3

### Patch Changes

- Updated dependencies [ce57ca0]
  - @halfdomelabs/sync@0.3.3
  - @halfdomelabs/core-generators@0.4.2

## 0.4.2

### Patch Changes

- 3f45e59: Fix changeset release process to build app before releasing
- Updated dependencies [3f45e59]
  - @halfdomelabs/core-generators@0.4.1
  - @halfdomelabs/sync@0.3.2

## 0.4.1

### Patch Changes

- Updated dependencies [c6893a5]
- Updated dependencies [c6893a5]
- Updated dependencies [c6893a5]
  - @halfdomelabs/core-generators@0.4.0
  - @halfdomelabs/sync@0.3.1

## 0.4.0

### Minor Changes

- dcd86ed: Switch all packages to ESM
- f7cb616: Switch to pnpm for package management

### Patch Changes

- Updated dependencies [dcd86ed]
- Updated dependencies [dcd86ed]
- Updated dependencies [f7cb616]
  - @halfdomelabs/core-generators@0.3.0
  - @halfdomelabs/sync@0.3.0

## 0.3.0

### Minor Changes

- e594b75: Switch to node-dev + SWC instead of ts-node-dev for much better CPU usage
- ec0218a: Switch service functions from a single object to individual functions

### Patch Changes

- ec0218a: Upgrade tsc-alias tooling
- Updated dependencies [ec0218a]
  - @halfdomelabs/core-generators@0.2.1
  - @halfdomelabs/sync@0.2.1

## 0.2.0

### Minor Changes

- 5f2d7d8: Prepare Baseplate packages for release

### Patch Changes

- Updated dependencies [5f2d7d8]
  - @halfdomelabs/core-generators@0.2.0
  - @halfdomelabs/sync@0.2.0
