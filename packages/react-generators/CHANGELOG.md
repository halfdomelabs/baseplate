# @halfdomelabs/react-generators

## 0.7.5

### Patch Changes

- Updated dependencies [988235d]
  - @halfdomelabs/core-generators@0.7.5

## 0.7.4

### Patch Changes

- a5bce9d: Update `react-router-dom` in Baseplate and generators.

  Refactor Project Builder Web App to use a data router to allow the `useBlocker` hook.

  Prevent navigation from dirty forms in modal and other forms.

## 0.7.3

### Patch Changes

- 922f0bf9: Upgrade prettier plugins and fix bug when prettier plugins were not present
- Updated dependencies [922f0bf9]
- Updated dependencies [42beb73c]
  - @halfdomelabs/core-generators@0.7.4
  - @halfdomelabs/sync@0.7.2

## 0.7.2

### Patch Changes

- a4949e51: Update Vite to `5.2.8`

## 0.7.1

### Patch Changes

- da0179b1: Upgrade Apollo client to 3.9.9

## 0.7.0

### Minor Changes

- f69fbf50: Upgrade vite to 5.2.4 and vitest to 1.4.0

### Patch Changes

- f69fbf50: Upgrade Axios to 1.6.8 to address security vuln
- Updated dependencies [f69fbf50]
- Updated dependencies [4c4cf8e5]
- Updated dependencies [4c4cf8e5]
  - @halfdomelabs/core-generators@0.7.3
  - @halfdomelabs/sync@0.7.2

## 0.6.4

### Patch Changes

- Updated dependencies [114717fe]
  - @halfdomelabs/sync@0.7.1
  - @halfdomelabs/core-generators@0.7.2

## 0.6.3

### Patch Changes

- 8cbdc8cc: Improve Sentry logging of GraphQL errors

## 0.6.2

### Patch Changes

- af5d0c53: Switch from module resolution Node to Bundler and standardized tsconfig for React generators
- af5d0c53: Upgrade date-fns to 3.2.0
- 8b50e477: Upgrade Typescript to 5.2.2 for generation
- af5d0c53: Upgrade react-icons to 5.0.1 and minor upgrades on component deps
- 9a9d4f2d: Upgrade Axios to 1.6.5
- 4e07d12a: Upgrade Vite to 4.5.2
  - @halfdomelabs/core-generators@0.7.1
  - @halfdomelabs/sync@0.7.0

## 0.6.1

### Patch Changes

- 9d0005b: Improve React Sentry Apollo integration to report more useful errors for GraphQL
- 3da6a70: Upgrade to Node 20 and Typescript 5.2.2, cleaning up tsconfig setup
- f12e2c1: Upgrade Vite to 4.5.1
- Updated dependencies [63794f7]
- Updated dependencies [3da6a70]
  - @halfdomelabs/sync@0.7.0
  - @halfdomelabs/core-generators@0.7.1

## 0.6.0

### Minor Changes

- c314b65: Upgrade to Node 18.18.2
- c314b65: Upgrade vite & react dependencies. NOTE: This requires changing SVG imports to append ?react to the end of them
- 0275a54: Switches Dialog to Shadcn component
- c314b65: Upgrade dependencies across the board to latest
- f24754d: Updated eslint/prettier rules

### Patch Changes

- f24754d: Upgrade to Node 18.17.1
- 47d84ca: Upgrade jest, Sentry, Postmark, and Stripe integrations to latest
- f24754d: Upgrade to Typescript 5.1
- 55268b6: Upgrade react-hook-form and resolver
- Updated dependencies [c314b65]
- Updated dependencies [c314b65]
- Updated dependencies [f24754d]
- Updated dependencies [47d84ca]
- Updated dependencies [c314b65]
- Updated dependencies [f24754d]
  - @halfdomelabs/core-generators@0.7.0
  - @halfdomelabs/sync@0.6.0

## 0.5.1

### Patch Changes

- c4c38ec: Upgraded dependencies and remove gulp
- Updated dependencies [c4c38ec]
  - @halfdomelabs/core-generators@0.6.1
  - @halfdomelabs/sync@0.5.1

## 0.5.0

### Minor Changes

- 08a2746: Switch generation from yarn v1 to pnpm for faster build times (run pnpm import - https://medium.com/frontendweb/how-to-manage-multiple-nodejs-versions-with-pnpm-8bcce90abedb)

### Patch Changes

- Updated dependencies [08a2746]
- Updated dependencies [66ff670]
  - @halfdomelabs/core-generators@0.6.0
  - @halfdomelabs/sync@0.5.0

## 0.4.0

### Minor Changes

- 0027b3d: Upgrade generated dependencies to get latest and greatest

### Patch Changes

- Updated dependencies [0027b3d]
- Updated dependencies [ba3f678]
  - @halfdomelabs/core-generators@0.5.0
  - @halfdomelabs/sync@0.4.0

## 0.3.3

### Patch Changes

- Updated dependencies [ce57ca0]
  - @halfdomelabs/sync@0.3.3
  - @halfdomelabs/core-generators@0.4.2

## 0.3.2

### Patch Changes

- 3f45e59: Fix changeset release process to build app before releasing
- Updated dependencies [3f45e59]
  - @halfdomelabs/core-generators@0.4.1
  - @halfdomelabs/sync@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies [c6893a5]
- Updated dependencies [c6893a5]
- Updated dependencies [c6893a5]
  - @halfdomelabs/core-generators@0.4.0
  - @halfdomelabs/sync@0.3.1

## 0.3.0

### Minor Changes

- dcd86ed: Switch all packages to ESM
- 4cd9061: Adds ErrorBoundary wrapper
- f7cb616: Switch to pnpm for package management

### Patch Changes

- Updated dependencies [dcd86ed]
- Updated dependencies [dcd86ed]
- Updated dependencies [f7cb616]
  - @halfdomelabs/core-generators@0.3.0
  - @halfdomelabs/sync@0.3.0

## 0.2.1

### Patch Changes

- ec0218a: Upgrade tsc-alias tooling
- e594b75: Default to localhost for Vite dev server instead of random order
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
