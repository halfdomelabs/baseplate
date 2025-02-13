# @halfdomelabs/react-generators

## 0.9.2

### Patch Changes

- [#436](https://github.com/halfdomelabs/baseplate/pull/436) [`1bc1674`](https://github.com/halfdomelabs/baseplate/commit/1bc167442e649490b22d3afc6c508fcd23a194a4) Thanks [@kingston](https://github.com/kingston)! - Upgrade Vitest to 3.0.5 and Sentry to 8.55.0

- [#430](https://github.com/halfdomelabs/baseplate/pull/430) [`2e5e7b4`](https://github.com/halfdomelabs/baseplate/commit/2e5e7b4b9fd1308ee06e5c83ac54fef7926685ab) Thanks [@kingston](https://github.com/kingston)! - Upgrade Vitest to 3.0.3 and Vite to 6.0.11 (and associated dependencies)

- Updated dependencies [[`1bc1674`](https://github.com/halfdomelabs/baseplate/commit/1bc167442e649490b22d3afc6c508fcd23a194a4), [`2e5e7b4`](https://github.com/halfdomelabs/baseplate/commit/2e5e7b4b9fd1308ee06e5c83ac54fef7926685ab)]:
  - @halfdomelabs/core-generators@0.10.2

## 0.9.1

### Patch Changes

- [#428](https://github.com/halfdomelabs/baseplate/pull/428) [`5507eb7`](https://github.com/halfdomelabs/baseplate/commit/5507eb77d5413d3b87fa50988a6e4a1d58d78a14) Thanks [@kingston](https://github.com/kingston)! - Refactor output file writing and support file IDs to allow rename operations

- Updated dependencies [[`5507eb7`](https://github.com/halfdomelabs/baseplate/commit/5507eb77d5413d3b87fa50988a6e4a1d58d78a14)]:
  - @halfdomelabs/sync@0.9.0
  - @halfdomelabs/core-generators@0.10.1

## 0.9.0

### Minor Changes

- [#420](https://github.com/halfdomelabs/baseplate/pull/420) [`f0ee4e0`](https://github.com/halfdomelabs/baseplate/commit/f0ee4e07fc9d40947f319efb788f7fb596848231) Thanks [@kingston](https://github.com/kingston)! - Refactor generators to pass instantiated generator directly to engine instead of intermediate JSON. Note: This means deleting any descriptor JSON files from the baseplate folder for each app as they are no longer used.

### Patch Changes

- [#406](https://github.com/halfdomelabs/baseplate/pull/406) [`cd92861`](https://github.com/halfdomelabs/baseplate/commit/cd92861d764380264dcc7d480407edf618421e70) Thanks [@kingston](https://github.com/kingston)! - Upgrade prettier-plugin-tailwindcss to 0.6.9

- [#416](https://github.com/halfdomelabs/baseplate/pull/416) [`b18263c`](https://github.com/halfdomelabs/baseplate/commit/b18263c1a06a74c9c5456b1efb0d7171e3b747cc) Thanks [@kingston](https://github.com/kingston)! - Refactor generators to use createGeneratorsWithTasks instead of createGeneratorsWithChildren

- [#414](https://github.com/halfdomelabs/baseplate/pull/414) [`bc756fd`](https://github.com/halfdomelabs/baseplate/commit/bc756fd5ec6c27f0b4883ca778fbbf2bc63106ed) Thanks [@kingston](https://github.com/kingston)! - Introduce concept of scopes for provider dependency resolution to replace hoisting/peer/parent resolution

- [#419](https://github.com/halfdomelabs/baseplate/pull/419) [`9f34f54`](https://github.com/halfdomelabs/baseplate/commit/9f34f54d6b6c9762f5237000c83aa9959116a282) Thanks [@kingston](https://github.com/kingston)! - Change monorepo tooling to Turborepo from NX for easier caching

- [#424](https://github.com/halfdomelabs/baseplate/pull/424) [`6a317cc`](https://github.com/halfdomelabs/baseplate/commit/6a317cc437fd53c9488067811bade99b167072f5) Thanks [@kingston](https://github.com/kingston)! - Replace lodash/ramda with es-tookit

- [#413](https://github.com/halfdomelabs/baseplate/pull/413) [`e76c097`](https://github.com/halfdomelabs/baseplate/commit/e76c09721852d1a367ca4867f5e6abc350684b0c) Thanks [@kingston](https://github.com/kingston)! - refactor: Remove deprecated export dependencies

- Updated dependencies [[`71e3257`](https://github.com/halfdomelabs/baseplate/commit/71e325718e71aabffc02108ad6e97aa7f99729c9), [`48bda89`](https://github.com/halfdomelabs/baseplate/commit/48bda899b7b4158ba6ec58118edacc3b61ddb043), [`70c6478`](https://github.com/halfdomelabs/baseplate/commit/70c6478dfe7a5cfe19200b838c97327cd2dc0757), [`cd92861`](https://github.com/halfdomelabs/baseplate/commit/cd92861d764380264dcc7d480407edf618421e70), [`b18263c`](https://github.com/halfdomelabs/baseplate/commit/b18263c1a06a74c9c5456b1efb0d7171e3b747cc), [`17fc44f`](https://github.com/halfdomelabs/baseplate/commit/17fc44f3c2d232c9712ed43a27439594b41ea139), [`bc756fd`](https://github.com/halfdomelabs/baseplate/commit/bc756fd5ec6c27f0b4883ca778fbbf2bc63106ed), [`a09b91f`](https://github.com/halfdomelabs/baseplate/commit/a09b91f2d1ebd4c91653bdc2a89d03947d1b06da), [`09243e5`](https://github.com/halfdomelabs/baseplate/commit/09243e511eefa65ce0809ec8b9228a74f690cdf6), [`9f34f54`](https://github.com/halfdomelabs/baseplate/commit/9f34f54d6b6c9762f5237000c83aa9959116a282), [`a09b91f`](https://github.com/halfdomelabs/baseplate/commit/a09b91f2d1ebd4c91653bdc2a89d03947d1b06da), [`62acb20`](https://github.com/halfdomelabs/baseplate/commit/62acb202ba44cf4bdbafdf5643d115c1811719ff), [`bc756fd`](https://github.com/halfdomelabs/baseplate/commit/bc756fd5ec6c27f0b4883ca778fbbf2bc63106ed), [`f0ee4e0`](https://github.com/halfdomelabs/baseplate/commit/f0ee4e07fc9d40947f319efb788f7fb596848231), [`09243e5`](https://github.com/halfdomelabs/baseplate/commit/09243e511eefa65ce0809ec8b9228a74f690cdf6), [`6a317cc`](https://github.com/halfdomelabs/baseplate/commit/6a317cc437fd53c9488067811bade99b167072f5), [`e76c097`](https://github.com/halfdomelabs/baseplate/commit/e76c09721852d1a367ca4867f5e6abc350684b0c)]:
  - @halfdomelabs/sync@0.8.0
  - @halfdomelabs/core-generators@0.10.0

## 0.8.8

### Patch Changes

- 6ca94da: Upgrade Zod to 3.24.1
- 354f4c9: [internal] Refactor formatter provider to become part of generator output
- 98518dd: Upgrade nanoid to 3.3.8 for generated versions
- Updated dependencies [6ca94da]
- Updated dependencies [354f4c9]
  - @halfdomelabs/core-generators@0.9.9
  - @halfdomelabs/sync@0.7.12

## 0.8.7

### Patch Changes

- 77d9399: Upgrade ESLint to v9 and use updated Linter configurations
- d1b05af: Upgrade Sentry packages to 8.41.0
- Updated dependencies [77d9399]
  - @halfdomelabs/core-generators@0.9.8
  - @halfdomelabs/sync@0.7.11

## 0.8.6

### Patch Changes

- 416f0941: Switch to ESM module resolution for backend (before syncing, run `pnpx migrate-esm-imports src baseplate/.clean` on your backend folder to minimize merge errors)
- c0300ef2: Upgrade Sentry to 8.34.0
- Updated dependencies [416f0941]
  - @halfdomelabs/core-generators@0.9.7
  - @halfdomelabs/sync@0.7.10

## 0.8.5

### Patch Changes

- 8cb0ef35: Upgrade autoprefixer to 10.4.20, tailwind to 3.4.11, pretter-plugin-tailwind to 0.6.6, @tailwindcss/forms to 0.5.9
- a6e3fd96: Upgrade react-hook-form to 7.53.0 and @hookform/resolvers to 3.9.0
- 37006225: Update UI for model editor
- 37006225: Upgrade react-error-boundary to 4.0.13
- 92654962: Upgrade Typescript to 5.5.4 using PNPM catalog
- 92c1401f: Upgrade vitest to 2.1.1 and vite to 5.4.7 and @types/react to 18.3.8
- 8cb0ef35: Upgrade assorted dependencies
- Updated dependencies [8cb0ef35]
- Updated dependencies [2373fec8]
- Updated dependencies [92654962]
- Updated dependencies [92c1401f]
- Updated dependencies [8cb0ef35]
  - @halfdomelabs/core-generators@0.9.6
  - @halfdomelabs/sync@0.7.9

## 0.8.4

### Patch Changes

- Updated dependencies [1835934]
- Updated dependencies [f44674a]
  - @halfdomelabs/core-generators@0.9.5
  - @halfdomelabs/sync@0.7.8

## 0.8.3

### Patch Changes

- 3dbb454: Ensure auth is optional for web generator
- Updated dependencies [3dbb454]
- Updated dependencies [3dbb454]
- Updated dependencies [3dbb454]
  - @halfdomelabs/core-generators@0.9.4
  - @halfdomelabs/sync@0.7.7

## 0.8.2

### Patch Changes

- 380bc35: Add watch:gql to watch for graphql changes

## 0.8.1

### Patch Changes

- Updated dependencies [ddbbead]
  - @halfdomelabs/core-generators@0.9.3
  - @halfdomelabs/sync@0.7.6

## 0.8.0

### Minor Changes

- 02a4d70: Upgrade Sentry to 8.19.0 (https://docs.sentry.io/platforms/javascript/migration/v7-to-v8/)

### Patch Changes

- 80100bd: Add @parcel/watcher to codegen dependencies to allow GraphQL watcher
- Updated dependencies [02a4d70]
  - @halfdomelabs/core-generators@0.9.2

## 0.7.9

### Patch Changes

- d8374b4: Upgrade tsc-alias to 1.8.10
- Updated dependencies [d8374b4]
  - @halfdomelabs/core-generators@0.9.1
  - @halfdomelabs/sync@0.7.5

## 0.7.8

### Patch Changes

- 267b839: Upgrade Vite to 5.3.3
- bcc68c0: Upgrade Pothos to v4
- 94feb66: Upgrade Typescript to 5.4.4
- 7e95126: Replace 'jest' with 'vitest'.
- c0b42fc: Upgrade eslint and plugins to latest v8 versions
- a6f01ea: Set up new plugin architecture and migrate storage plugin to new plugin architecture
- 94feb66: Upgrade React to 18.3.1
- 94feb66: Upgrade loglevel to 1.9.1
- Updated dependencies [e32a926]
- Updated dependencies [bcc68c0]
- Updated dependencies [94feb66]
- Updated dependencies [7e95126]
- Updated dependencies [c0b42fc]
- Updated dependencies [e32a926]
- Updated dependencies [a6f01ea]
  - @halfdomelabs/core-generators@0.9.0
  - @halfdomelabs/sync@0.7.4

## 0.7.7

### Patch Changes

- 082dfc3: Upgrade Zod to 3.23.8
- 082dfc3: Lay groundwork for initial plugin system with plugin discovery [in development]
- Updated dependencies [3b720a2]
- Updated dependencies [082dfc3]
- Updated dependencies [082dfc3]
- Updated dependencies [eda7e94]
- Updated dependencies [3f95dc6]
- Updated dependencies [3f95dc6]
  - @halfdomelabs/core-generators@0.8.0
  - @halfdomelabs/sync@0.7.3

## 0.7.6

### Patch Changes

- a4fb47d: Update npm dependencies for tailwindcss to 3.4.3 and associated packages
- 9f33a18: Switch Vite projects to use ESM instead of CJS
- 9cab58f: Replace classnames with clsx.
- Updated dependencies [9f33a18]
  - @halfdomelabs/core-generators@0.7.6
  - @halfdomelabs/sync@0.7.2

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
