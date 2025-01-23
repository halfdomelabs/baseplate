# @halfdomelabs/baseplate-plugin-storage

## 3.0.0

### Patch Changes

- Updated dependencies [[`5507eb7`](https://github.com/halfdomelabs/baseplate/commit/5507eb77d5413d3b87fa50988a6e4a1d58d78a14)]:
  - @halfdomelabs/sync@0.9.0
  - @halfdomelabs/fastify-generators@0.11.1
  - @halfdomelabs/react-generators@0.9.1
  - @halfdomelabs/core-generators@0.10.1
  - @halfdomelabs/project-builder-lib@0.9.1

## 2.0.0

### Minor Changes

- [#420](https://github.com/halfdomelabs/baseplate/pull/420) [`f0ee4e0`](https://github.com/halfdomelabs/baseplate/commit/f0ee4e07fc9d40947f319efb788f7fb596848231) Thanks [@kingston](https://github.com/kingston)! - Refactor generators to pass instantiated generator directly to engine instead of intermediate JSON. Note: This means deleting any descriptor JSON files from the baseplate folder for each app as they are no longer used.

### Patch Changes

- [#402](https://github.com/halfdomelabs/baseplate/pull/402) [`48bda89`](https://github.com/halfdomelabs/baseplate/commit/48bda899b7b4158ba6ec58118edacc3b61ddb043) Thanks [@kingston](https://github.com/kingston)! - Support generation on Windows platforms

- [#404](https://github.com/halfdomelabs/baseplate/pull/404) [`70c6478`](https://github.com/halfdomelabs/baseplate/commit/70c6478dfe7a5cfe19200b838c97327cd2dc0757) Thanks [@kingston](https://github.com/kingston)! - Refactor Auth0 generators to use new more extensible auth pattern

- [#416](https://github.com/halfdomelabs/baseplate/pull/416) [`b18263c`](https://github.com/halfdomelabs/baseplate/commit/b18263c1a06a74c9c5456b1efb0d7171e3b747cc) Thanks [@kingston](https://github.com/kingston)! - Refactor generators to use createGeneratorsWithTasks instead of createGeneratorsWithChildren

- [#414](https://github.com/halfdomelabs/baseplate/pull/414) [`bc756fd`](https://github.com/halfdomelabs/baseplate/commit/bc756fd5ec6c27f0b4883ca778fbbf2bc63106ed) Thanks [@kingston](https://github.com/kingston)! - Introduce concept of scopes for provider dependency resolution to replace hoisting/peer/parent resolution

- [#419](https://github.com/halfdomelabs/baseplate/pull/419) [`9f34f54`](https://github.com/halfdomelabs/baseplate/commit/9f34f54d6b6c9762f5237000c83aa9959116a282) Thanks [@kingston](https://github.com/kingston)! - Change monorepo tooling to Turborepo from NX for easier caching

- Updated dependencies [[`71e3257`](https://github.com/halfdomelabs/baseplate/commit/71e325718e71aabffc02108ad6e97aa7f99729c9), [`f33c7d3`](https://github.com/halfdomelabs/baseplate/commit/f33c7d33d883e36aa18ad5e1976bf737d7f84897), [`48bda89`](https://github.com/halfdomelabs/baseplate/commit/48bda899b7b4158ba6ec58118edacc3b61ddb043), [`cd92861`](https://github.com/halfdomelabs/baseplate/commit/cd92861d764380264dcc7d480407edf618421e70), [`70c6478`](https://github.com/halfdomelabs/baseplate/commit/70c6478dfe7a5cfe19200b838c97327cd2dc0757), [`cd92861`](https://github.com/halfdomelabs/baseplate/commit/cd92861d764380264dcc7d480407edf618421e70), [`9375d01`](https://github.com/halfdomelabs/baseplate/commit/9375d01cf35380395d4afdaa41c0bafb50bffba5), [`b18263c`](https://github.com/halfdomelabs/baseplate/commit/b18263c1a06a74c9c5456b1efb0d7171e3b747cc), [`17fc44f`](https://github.com/halfdomelabs/baseplate/commit/17fc44f3c2d232c9712ed43a27439594b41ea139), [`bc756fd`](https://github.com/halfdomelabs/baseplate/commit/bc756fd5ec6c27f0b4883ca778fbbf2bc63106ed), [`a09b91f`](https://github.com/halfdomelabs/baseplate/commit/a09b91f2d1ebd4c91653bdc2a89d03947d1b06da), [`09243e5`](https://github.com/halfdomelabs/baseplate/commit/09243e511eefa65ce0809ec8b9228a74f690cdf6), [`9f34f54`](https://github.com/halfdomelabs/baseplate/commit/9f34f54d6b6c9762f5237000c83aa9959116a282), [`a09b91f`](https://github.com/halfdomelabs/baseplate/commit/a09b91f2d1ebd4c91653bdc2a89d03947d1b06da), [`62acb20`](https://github.com/halfdomelabs/baseplate/commit/62acb202ba44cf4bdbafdf5643d115c1811719ff), [`bc756fd`](https://github.com/halfdomelabs/baseplate/commit/bc756fd5ec6c27f0b4883ca778fbbf2bc63106ed), [`f0ee4e0`](https://github.com/halfdomelabs/baseplate/commit/f0ee4e07fc9d40947f319efb788f7fb596848231), [`09243e5`](https://github.com/halfdomelabs/baseplate/commit/09243e511eefa65ce0809ec8b9228a74f690cdf6), [`6a317cc`](https://github.com/halfdomelabs/baseplate/commit/6a317cc437fd53c9488067811bade99b167072f5), [`e76c097`](https://github.com/halfdomelabs/baseplate/commit/e76c09721852d1a367ca4867f5e6abc350684b0c), [`cd92861`](https://github.com/halfdomelabs/baseplate/commit/cd92861d764380264dcc7d480407edf618421e70), [`4774215`](https://github.com/halfdomelabs/baseplate/commit/4774215925838ad4bfc418a4655de72733a06c5f), [`70c6478`](https://github.com/halfdomelabs/baseplate/commit/70c6478dfe7a5cfe19200b838c97327cd2dc0757)]:
  - @halfdomelabs/sync@0.8.0
  - @halfdomelabs/core-generators@0.10.0
  - @halfdomelabs/fastify-generators@0.11.0
  - @halfdomelabs/project-builder-lib@0.9.0
  - @halfdomelabs/react-generators@0.9.0
  - @halfdomelabs/ui-components@0.5.2

## 1.0.15

### Patch Changes

- 6ca94da: Upgrade Zod to 3.24.1
- Updated dependencies [6ca94da]
- Updated dependencies [354f4c9]
- Updated dependencies [f7184a8]
- Updated dependencies [98518dd]
- Updated dependencies [98518dd]
- Updated dependencies [144d796]
- Updated dependencies [d7ec6ee]
  - @halfdomelabs/project-builder-lib@0.8.13
  - @halfdomelabs/fastify-generators@0.10.9
  - @halfdomelabs/react-generators@0.8.8
  - @halfdomelabs/core-generators@0.9.9
  - @halfdomelabs/ui-components@0.5.1
  - @halfdomelabs/sync@0.7.12

## 1.0.14

### Patch Changes

- 77d9399: Upgrade ESLint to v9 and use updated Linter configurations
- Updated dependencies [77d9399]
- Updated dependencies [d1b05af]
- Updated dependencies [f11b044]
- Updated dependencies [dc74c47]
- Updated dependencies [05fbd9c]
- Updated dependencies [d1b05af]
  - @halfdomelabs/project-builder-lib@0.8.12
  - @halfdomelabs/fastify-generators@0.10.8
  - @halfdomelabs/react-generators@0.8.7
  - @halfdomelabs/core-generators@0.9.8
  - @halfdomelabs/ui-components@0.5.0
  - @halfdomelabs/sync@0.7.11

## 1.0.13

### Patch Changes

- 416f0941: Switch to ESM module resolution for backend (before syncing, run `pnpx migrate-esm-imports src baseplate/.clean` on your backend folder to minimize merge errors)
- Updated dependencies [416f0941]
- Updated dependencies [c0300ef2]
  - @halfdomelabs/fastify-generators@0.10.7
  - @halfdomelabs/react-generators@0.8.6
  - @halfdomelabs/core-generators@0.9.7
  - @halfdomelabs/sync@0.7.10
  - @halfdomelabs/project-builder-lib@0.8.11

## 1.0.12

### Patch Changes

- Updated dependencies [f3675692]
  - @halfdomelabs/fastify-generators@0.10.6

## 1.0.11

### Patch Changes

- f92a4670: Add useBlockUnsavedChangesNavigate hook to allow users to save before proceeding
- 32021f09: Improve docs for model service page
- a6e3fd96: Upgrade react-hook-form to 7.53.0 and @hookform/resolvers to 3.9.0
- 37006225: Update UI for model editor
- 92654962: Upgrade Typescript to 5.5.4 using PNPM catalog
- 92c1401f: Upgrade vitest to 2.1.1 and vite to 5.4.7 and @types/react to 18.3.8
- 8cb0ef35: Upgrade assorted dependencies
- Updated dependencies [c03c3e34]
- Updated dependencies [8cb0ef35]
- Updated dependencies [03f3df6a]
- Updated dependencies [f92a4670]
- Updated dependencies [18ef42fe]
- Updated dependencies [32021f09]
- Updated dependencies [a6e3fd96]
- Updated dependencies [d447024b]
- Updated dependencies [c6b14371]
- Updated dependencies [2579aee0]
- Updated dependencies [37006225]
- Updated dependencies [c835165c]
- Updated dependencies [8cb0ef35]
- Updated dependencies [37006225]
- Updated dependencies [2373fec8]
- Updated dependencies [92654962]
- Updated dependencies [040d9a38]
- Updated dependencies [92c1401f]
- Updated dependencies [79a6eb64]
- Updated dependencies [8cb0ef35]
- Updated dependencies [1bd25964]
  - @halfdomelabs/ui-components@0.4.15
  - @halfdomelabs/react-generators@0.8.5
  - @halfdomelabs/project-builder-lib@0.8.10
  - @halfdomelabs/fastify-generators@0.10.5
  - @halfdomelabs/core-generators@0.9.6
  - @halfdomelabs/sync@0.7.9

## 1.0.10

### Patch Changes

- 085932d: Upgrade axios to 1.7.4 to address security vulnerability
- Updated dependencies [ccff8f1]
- Updated dependencies [fb031a3]
- Updated dependencies [a5dbd3a]
- Updated dependencies [5f8af00]
- Updated dependencies [c86aaaf]
- Updated dependencies [fb031a3]
- Updated dependencies [1835934]
- Updated dependencies [f44674a]
- Updated dependencies [085932d]
  - @halfdomelabs/ui-components@0.4.14
  - @halfdomelabs/fastify-generators@0.10.4
  - @halfdomelabs/core-generators@0.9.5
  - @halfdomelabs/sync@0.7.8
  - @halfdomelabs/project-builder-lib@0.8.9
  - @halfdomelabs/react-generators@0.8.4

## 1.0.9

### Patch Changes

- Updated dependencies [3dbb454]
- Updated dependencies [3dbb454]
- Updated dependencies [3dbb454]
- Updated dependencies [3dbb454]
- Updated dependencies [3dbb454]
- Updated dependencies [3dbb454]
- Updated dependencies [3dbb454]
  - @halfdomelabs/project-builder-lib@0.8.8
  - @halfdomelabs/core-generators@0.9.4
  - @halfdomelabs/fastify-generators@0.10.3
  - @halfdomelabs/react-generators@0.8.3
  - @halfdomelabs/ui-components@0.4.13
  - @halfdomelabs/sync@0.7.7

## 1.0.8

### Patch Changes

- Updated dependencies [380bc35]
- Updated dependencies [53fd56d]
- Updated dependencies [c58b1ab]
- Updated dependencies [3256d45]
- Updated dependencies [b06f805]
- Updated dependencies [380bc35]
  - @halfdomelabs/fastify-generators@0.10.2
  - @halfdomelabs/ui-components@0.4.12
  - @halfdomelabs/project-builder-lib@0.8.7
  - @halfdomelabs/react-generators@0.8.2

## 1.0.7

### Patch Changes

- Updated dependencies [a6a6653]
  - @halfdomelabs/project-builder-lib@0.8.6

## 1.0.6

### Patch Changes

- ddbbead: Upgrade vitest to 2.0.3
- Updated dependencies [ddbbead]
  - @halfdomelabs/project-builder-lib@0.8.5
  - @halfdomelabs/core-generators@0.9.3
  - @halfdomelabs/ui-components@0.4.11
  - @halfdomelabs/sync@0.7.6
  - @halfdomelabs/fastify-generators@0.10.1
  - @halfdomelabs/react-generators@0.8.1

## 1.0.5

### Patch Changes

- Updated dependencies [ab0b4f0]
  - @halfdomelabs/project-builder-lib@0.8.4

## 1.0.4

### Patch Changes

- Updated dependencies [80100bd]
- Updated dependencies [02a4d70]
- Updated dependencies [e559b45]
- Updated dependencies [02a4d70]
  - @halfdomelabs/react-generators@0.8.0
  - @halfdomelabs/fastify-generators@0.10.0
  - @halfdomelabs/core-generators@0.9.2

## 1.0.3

### Patch Changes

- 64bc313: Fix web entry target sourcing to source plugins from source folder instead of dist
- Updated dependencies [64bc313]
  - @halfdomelabs/project-builder-lib@0.8.3

## 1.0.2

### Patch Changes

- Updated dependencies [b86ae48]
  - @halfdomelabs/project-builder-lib@0.8.2

## 1.0.1

### Patch Changes

- 3f700cb: Fix resolution of compiled typescript
- d8374b4: Upgrade tsc-alias to 1.8.10
- Updated dependencies [d8374b4]
- Updated dependencies [e27c549]
  - @halfdomelabs/project-builder-lib@0.8.1
  - @halfdomelabs/fastify-generators@0.9.1
  - @halfdomelabs/react-generators@0.7.9
  - @halfdomelabs/core-generators@0.9.1
  - @halfdomelabs/ui-components@0.4.10
  - @halfdomelabs/sync@0.7.5

## 1.0.0

### Minor Changes

- a6f01ea: Set up new plugin architecture and migrate storage plugin to new plugin architecture

### Patch Changes

- 267b839: Upgrade Vite to 5.3.3
- 94feb66: Upgrade Typescript to 5.4.4
- Updated dependencies [0cadfee]
- Updated dependencies [e32a926]
- Updated dependencies [267b839]
- Updated dependencies [bcc68c0]
- Updated dependencies [94feb66]
- Updated dependencies [94feb66]
- Updated dependencies [7e95126]
- Updated dependencies [c0b42fc]
- Updated dependencies [e32a926]
- Updated dependencies [a6f01ea]
- Updated dependencies [dafb793]
- Updated dependencies [94feb66]
- Updated dependencies [94feb66]
  - @halfdomelabs/project-builder-lib@0.8.0
  - @halfdomelabs/core-generators@0.9.0
  - @halfdomelabs/react-generators@0.7.8
  - @halfdomelabs/ui-components@0.4.9
  - @halfdomelabs/fastify-generators@0.9.0
  - @halfdomelabs/sync@0.7.4

## 0.1.2

### Patch Changes

- Updated dependencies [6f7b930]
  - @halfdomelabs/project-builder-lib@0.7.6

## 0.1.1

### Patch Changes

- 082dfc3: Upgrade Zod to 3.23.8
- Updated dependencies [082dfc3]
- Updated dependencies [082dfc3]
  - @halfdomelabs/project-builder-lib@0.7.5
  - @halfdomelabs/sync@0.7.3
