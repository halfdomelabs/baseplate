# @halfdomelabs/fastify-generators

## 0.10.8

### Patch Changes

- 77d9399: Upgrade ESLint to v9 and use updated Linter configurations
- d1b05af: Upgrade Fastify and associated packages to v5 versions
- d1b05af: Upgrade Sentry packages to 8.41.0
- Updated dependencies [77d9399]
  - @halfdomelabs/core-generators@0.9.8
  - @halfdomelabs/sync@0.7.11

## 0.10.7

### Patch Changes

- 416f0941: Switch to ESM module resolution for backend (before syncing, run `pnpx migrate-esm-imports src baseplate/.clean` on your backend folder to minimize merge errors)
- c0300ef2: Upgrade Sentry to 8.34.0
- Updated dependencies [416f0941]
  - @halfdomelabs/core-generators@0.9.7
  - @halfdomelabs/sync@0.7.10

## 0.10.6

### Patch Changes

- f3675692: Fix Sentry ignored transaction paths logic

## 0.10.5

### Patch Changes

- 18ef42fe: Upgrade pino to 9.4.0 and pino-pretty to 11.2.2
- 92654962: Upgrade Typescript to 5.5.4 using PNPM catalog
- 040d9a38: Upgrade Prisma to 5.19.1
- 8cb0ef35: Upgrade assorted dependencies
- Updated dependencies [8cb0ef35]
- Updated dependencies [2373fec8]
- Updated dependencies [92654962]
- Updated dependencies [92c1401f]
- Updated dependencies [8cb0ef35]
  - @halfdomelabs/core-generators@0.9.6
  - @halfdomelabs/sync@0.7.9

## 0.10.4

### Patch Changes

- a5dbd3a: Update docker-compose command to docker compose to reflect v2 changes
- c86aaaf: Ensure schema does not get generated if no authorize
- fb031a3: Add validation of float/int defaults
- 1835934: Update tsconfig to support Node 20 target/lib
- 085932d: Upgrade axios to 1.7.4 to address security vulnerability
- Updated dependencies [1835934]
- Updated dependencies [f44674a]
  - @halfdomelabs/core-generators@0.9.5
  - @halfdomelabs/sync@0.7.8

## 0.10.3

### Patch Changes

- 3dbb454: Add new plugin to strip empty query and mutations from schema.graphql
- Updated dependencies [3dbb454]
- Updated dependencies [3dbb454]
- Updated dependencies [3dbb454]
  - @halfdomelabs/core-generators@0.9.4
  - @halfdomelabs/sync@0.7.7

## 0.10.2

### Patch Changes

- 380bc35: Don't regenerate schema.graphql if schema does not change
- c58b1ab: Refactor Sentry generators to move sentry logging to event processor
- 3256d45: Upgrade fastify to 4.28.1

## 0.10.1

### Patch Changes

- Updated dependencies [ddbbead]
  - @halfdomelabs/core-generators@0.9.3
  - @halfdomelabs/sync@0.7.6

## 0.10.0

### Minor Changes

- 02a4d70: Upgrade Sentry to 8.19.0 (https://docs.sentry.io/platforms/javascript/migration/v7-to-v8/)

### Patch Changes

- 02a4d70: Upgrade Prisma to 5.17.0
- e559b45: Update with correct README for Fastify
- Updated dependencies [02a4d70]
  - @halfdomelabs/core-generators@0.9.2

## 0.9.1

### Patch Changes

- d8374b4: Upgrade tsc-alias to 1.8.10
- e27c549: Remove storage generators from fastify-generators
- Updated dependencies [d8374b4]
  - @halfdomelabs/core-generators@0.9.1
  - @halfdomelabs/sync@0.7.5

## 0.9.0

### Minor Changes

- 7e95126: Replace 'jest' with 'vitest'.
- dafb793: Generate Fastify backend README

### Patch Changes

- bcc68c0: Upgrade Pothos to v4
- 94feb66: Upgrade @types/lodash to 4.17.7
- 94feb66: Upgrade Typescript to 5.4.4
- c0b42fc: Upgrade eslint and plugins to latest v8 versions
- a6f01ea: Set up new plugin architecture and migrate storage plugin to new plugin architecture
- Updated dependencies [e32a926]
- Updated dependencies [bcc68c0]
- Updated dependencies [94feb66]
- Updated dependencies [7e95126]
- Updated dependencies [c0b42fc]
- Updated dependencies [e32a926]
- Updated dependencies [a6f01ea]
  - @halfdomelabs/core-generators@0.9.0
  - @halfdomelabs/sync@0.7.4

## 0.8.11

### Patch Changes

- 4ad2639: Upgrade graphql-yoga to 5.3.1
- 082dfc3: Upgrade Zod to 3.23.8
- 082dfc3: Lay groundwork for initial plugin system with plugin discovery [in development]
- 3b720a2: Fix up websockets not to depend on auth service being available
- Updated dependencies [3b720a2]
- Updated dependencies [082dfc3]
- Updated dependencies [082dfc3]
- Updated dependencies [eda7e94]
- Updated dependencies [3f95dc6]
- Updated dependencies [3f95dc6]
  - @halfdomelabs/core-generators@0.8.0
  - @halfdomelabs/sync@0.7.3

## 0.8.10

### Patch Changes

- 9ffa848: Update @bull-board/api and @bull-board/fastify to version 5.17.1
- 725e0a9: Remove usage of tracesSampleRate which is overriden by tracesSampler with Sentry
- Updated dependencies [9f33a18]
  - @halfdomelabs/core-generators@0.7.6
  - @halfdomelabs/sync@0.7.2

## 0.8.9

### Patch Changes

- Updated dependencies [988235d]
  - @halfdomelabs/core-generators@0.7.5

## 0.8.8

### Patch Changes

- Updated dependencies [922f0bf9]
- Updated dependencies [42beb73c]
  - @halfdomelabs/core-generators@0.7.4
  - @halfdomelabs/sync@0.7.2

## 0.8.7

### Patch Changes

- 472c8663: Disable GraphQL Yoga UI in production

## 0.8.6

### Patch Changes

- f69fbf50: Upgrade Axios to 1.6.8 to address security vuln
- eca44bc1: Fix embedded one-to-many helper to support composite primary keys that have UUID and a non-string secondary key e.g. an enum key
- f69fbf50: Upgrade vite to 5.2.4 and vitest to 1.4.0
- b4219050: Suppress repeated Redis connection failure errors
- Updated dependencies [f69fbf50]
- Updated dependencies [4c4cf8e5]
- Updated dependencies [4c4cf8e5]
  - @halfdomelabs/core-generators@0.7.3
  - @halfdomelabs/sync@0.7.2

## 0.8.5

### Patch Changes

- 427f534f: Remove extra import from fastify-sentry

## 0.8.4

### Patch Changes

- Updated dependencies [114717fe]
  - @halfdomelabs/sync@0.7.1
  - @halfdomelabs/core-generators@0.7.2

## 0.8.3

### Patch Changes

- cd0fe8dd: Fix bug with cookies being stripped by Sentry extractRequestData
- 8cbdc8cc: Improve Sentry logging of GraphQL errors

## 0.8.2

### Patch Changes

- 1e30f98b: Fix worker typings for new BullMQ version

## 0.8.1

### Patch Changes

- ae358f50: Upgrade fastify to 4.25.2 to fix websocket issues
- 0583ca1e: Fix embedded relation transform output type to use narrower type to work with new Prisma types
- f2d0c7b6: Upgrade Prisma to 5.7.1
- 0ef0915d: Fix generation of multi-column primary key queries and mutations
- 8b50e477: Upgrade Typescript to 5.2.2 for generation
- 8c0a2d5b: Add ability to set defaults on enum fields
- 9a9d4f2d: Upgrade Axios to 1.6.5
- 57216eab: Upgrade BullMQ to 5.1.1 and Bull Board to latest
  - @halfdomelabs/core-generators@0.7.1
  - @halfdomelabs/sync@0.7.0

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
