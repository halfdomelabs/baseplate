# @halfdomelabs/project-builder-lib

## 0.9.1

### Patch Changes

- Updated dependencies [[`5507eb7`](https://github.com/halfdomelabs/baseplate/commit/5507eb77d5413d3b87fa50988a6e4a1d58d78a14), [`5507eb7`](https://github.com/halfdomelabs/baseplate/commit/5507eb77d5413d3b87fa50988a6e4a1d58d78a14)]:
  - @halfdomelabs/sync@0.9.0
  - @halfdomelabs/utils@0.1.2

## 0.9.0

### Minor Changes

- [#404](https://github.com/halfdomelabs/baseplate/pull/404) [`70c6478`](https://github.com/halfdomelabs/baseplate/commit/70c6478dfe7a5cfe19200b838c97327cd2dc0757) Thanks [@kingston](https://github.com/kingston)! - Refactor Auth0 generators to use new more extensible auth pattern

- [#420](https://github.com/halfdomelabs/baseplate/pull/420) [`f0ee4e0`](https://github.com/halfdomelabs/baseplate/commit/f0ee4e07fc9d40947f319efb788f7fb596848231) Thanks [@kingston](https://github.com/kingston)! - Refactor generators to pass instantiated generator directly to engine instead of intermediate JSON. Note: This means deleting any descriptor JSON files from the baseplate folder for each app as they are no longer used.

- [#404](https://github.com/halfdomelabs/baseplate/pull/404) [`70c6478`](https://github.com/halfdomelabs/baseplate/commit/70c6478dfe7a5cfe19200b838c97327cd2dc0757) Thanks [@kingston](https://github.com/kingston)! - Remove normal auth and nexus generators

### Patch Changes

- [#402](https://github.com/halfdomelabs/baseplate/pull/402) [`48bda89`](https://github.com/halfdomelabs/baseplate/commit/48bda899b7b4158ba6ec58118edacc3b61ddb043) Thanks [@kingston](https://github.com/kingston)! - Support generation on Windows platforms

- [#419](https://github.com/halfdomelabs/baseplate/pull/419) [`9f34f54`](https://github.com/halfdomelabs/baseplate/commit/9f34f54d6b6c9762f5237000c83aa9959116a282) Thanks [@kingston](https://github.com/kingston)! - Change monorepo tooling to Turborepo from NX for easier caching

- [#424](https://github.com/halfdomelabs/baseplate/pull/424) [`6a317cc`](https://github.com/halfdomelabs/baseplate/commit/6a317cc437fd53c9488067811bade99b167072f5) Thanks [@kingston](https://github.com/kingston)! - Replace lodash/ramda with es-tookit

- Updated dependencies [[`71e3257`](https://github.com/halfdomelabs/baseplate/commit/71e325718e71aabffc02108ad6e97aa7f99729c9), [`48bda89`](https://github.com/halfdomelabs/baseplate/commit/48bda899b7b4158ba6ec58118edacc3b61ddb043), [`6a317cc`](https://github.com/halfdomelabs/baseplate/commit/6a317cc437fd53c9488067811bade99b167072f5), [`9375d01`](https://github.com/halfdomelabs/baseplate/commit/9375d01cf35380395d4afdaa41c0bafb50bffba5), [`b18263c`](https://github.com/halfdomelabs/baseplate/commit/b18263c1a06a74c9c5456b1efb0d7171e3b747cc), [`17fc44f`](https://github.com/halfdomelabs/baseplate/commit/17fc44f3c2d232c9712ed43a27439594b41ea139), [`bc756fd`](https://github.com/halfdomelabs/baseplate/commit/bc756fd5ec6c27f0b4883ca778fbbf2bc63106ed), [`a09b91f`](https://github.com/halfdomelabs/baseplate/commit/a09b91f2d1ebd4c91653bdc2a89d03947d1b06da), [`9f34f54`](https://github.com/halfdomelabs/baseplate/commit/9f34f54d6b6c9762f5237000c83aa9959116a282), [`a09b91f`](https://github.com/halfdomelabs/baseplate/commit/a09b91f2d1ebd4c91653bdc2a89d03947d1b06da), [`62acb20`](https://github.com/halfdomelabs/baseplate/commit/62acb202ba44cf4bdbafdf5643d115c1811719ff), [`bc756fd`](https://github.com/halfdomelabs/baseplate/commit/bc756fd5ec6c27f0b4883ca778fbbf2bc63106ed), [`f0ee4e0`](https://github.com/halfdomelabs/baseplate/commit/f0ee4e07fc9d40947f319efb788f7fb596848231), [`e76c097`](https://github.com/halfdomelabs/baseplate/commit/e76c09721852d1a367ca4867f5e6abc350684b0c), [`cd92861`](https://github.com/halfdomelabs/baseplate/commit/cd92861d764380264dcc7d480407edf618421e70), [`4774215`](https://github.com/halfdomelabs/baseplate/commit/4774215925838ad4bfc418a4655de72733a06c5f)]:
  - @halfdomelabs/sync@0.8.0
  - @halfdomelabs/utils@0.1.1
  - @halfdomelabs/ui-components@0.5.2

## 0.8.13

### Patch Changes

- 6ca94da: Upgrade Zod to 3.24.1
- 98518dd: Upgrade nanoid to 5.0.9
- Updated dependencies [6ca94da]
- Updated dependencies [354f4c9]
  - @halfdomelabs/ui-components@0.5.1
  - @halfdomelabs/sync@0.7.12

## 0.8.12

### Patch Changes

- 77d9399: Upgrade ESLint to v9 and use updated Linter configurations
- Updated dependencies [77d9399]
- Updated dependencies [f11b044]
- Updated dependencies [dc74c47]
- Updated dependencies [05fbd9c]
  - @halfdomelabs/ui-components@0.5.0
  - @halfdomelabs/sync@0.7.11

## 0.8.11

### Patch Changes

- Updated dependencies [416f0941]
  - @halfdomelabs/sync@0.7.10

## 0.8.10

### Patch Changes

- 03f3df6a: Force service methods to be enabled before enabling in GraphQL
- f92a4670: Add useBlockUnsavedChangesNavigate hook to allow users to save before proceeding
- 32021f09: Improve docs for model service page
- a6e3fd96: Upgrade react-hook-form to 7.53.0 and @hookform/resolvers to 3.9.0
- d447024b: Add validation for package location paths
- 37006225: Update UI for model editor
- c835165c: Allow features to be created from model/enum forms
- 92654962: Upgrade Typescript to 5.5.4 using PNPM catalog
- 92c1401f: Upgrade vitest to 2.1.1 and vite to 5.4.7 and @types/react to 18.3.8
- 8cb0ef35: Upgrade assorted dependencies
- 1bd25964: Improve hot-reload experience by waiting for compilation to finish
- Updated dependencies [c03c3e34]
- Updated dependencies [a6e3fd96]
- Updated dependencies [c6b14371]
- Updated dependencies [2579aee0]
- Updated dependencies [37006225]
- Updated dependencies [c835165c]
- Updated dependencies [92654962]
- Updated dependencies [92c1401f]
- Updated dependencies [79a6eb64]
- Updated dependencies [8cb0ef35]
  - @halfdomelabs/ui-components@0.4.15
  - @halfdomelabs/sync@0.7.9

## 0.8.9

### Patch Changes

- Updated dependencies [ccff8f1]
- Updated dependencies [fb031a3]
- Updated dependencies [5f8af00]
- Updated dependencies [f44674a]
  - @halfdomelabs/ui-components@0.4.14
  - @halfdomelabs/sync@0.7.8

## 0.8.8

### Patch Changes

- 3dbb454: Introduce new @halfdomelabs/project-builder-common library to contain all default plugins and generators
- Updated dependencies [3dbb454]
- Updated dependencies [3dbb454]
  - @halfdomelabs/ui-components@0.4.13
  - @halfdomelabs/sync@0.7.7

## 0.8.7

### Patch Changes

- b06f805: Add unsaved changes blocker to sync button and create enum button
- Updated dependencies [53fd56d]
  - @halfdomelabs/ui-components@0.4.12

## 0.8.6

### Patch Changes

- a6a6653: Throw error when fetching plugin targets but no targets found

## 0.8.5

### Patch Changes

- ddbbead: Upgrade vitest to 2.0.3
- Updated dependencies [ddbbead]
  - @halfdomelabs/ui-components@0.4.11
  - @halfdomelabs/sync@0.7.6

## 0.8.4

### Patch Changes

- ab0b4f0: Restore embedded local admin input to config schema

## 0.8.3

### Patch Changes

- 64bc313: Fix web entry target sourcing to source plugins from source folder instead of dist

## 0.8.2

### Patch Changes

- b86ae48: Fix loading of web plugin paths

## 0.8.1

### Patch Changes

- d8374b4: Upgrade tsc-alias to 1.8.10
- Updated dependencies [d8374b4]
  - @halfdomelabs/ui-components@0.4.10
  - @halfdomelabs/sync@0.7.5

## 0.8.0

### Minor Changes

- a6f01ea: Set up new plugin architecture and migrate storage plugin to new plugin architecture

### Patch Changes

- 0cadfee: Enable plugin functionality by default
- 94feb66: Upgrade Typescript to 5.4.4
- c0b42fc: Upgrade eslint and plugins to latest v8 versions
- Updated dependencies [267b839]
- Updated dependencies [94feb66]
- Updated dependencies [a6f01ea]
  - @halfdomelabs/ui-components@0.4.9
  - @halfdomelabs/sync@0.7.4

## 0.7.6

### Patch Changes

- 6f7b930: Add safeNameFromId to project definition container

## 0.7.5

### Patch Changes

- 082dfc3: Upgrade Zod to 3.23.8
- 082dfc3: Lay groundwork for initial plugin system with plugin discovery [in development]

## 0.7.4

### Patch Changes

- 377b433: Update project builder to use new color system from updated design system

## 0.7.3

### Patch Changes

- 6b368f5: Rename project config to project definition

## 0.7.2

### Patch Changes

- f69fbf50: Upgrade vite to 5.2.4 and vitest to 1.4.0
- 4c4cf8e5: Added sorting of package.json with prettier

## 0.7.1

### Patch Changes

- 1e30f98b: Fix generation of admin display forms
- 1e30f98b: Fix bug where not all IDs were being added to the entities

## 0.7.0

### Minor Changes

- ae358f50: Switch over project builder to new reference system

### Patch Changes

- 0583ca1e: Enable names of entities to be references to other fields
- fdd80b5a: Improve reference errors when deleting fields/models/enums
- 0ef0915d: Fix bug with adding fields and saving schema/services
- 8c0a2d5b: Add ability to set defaults on enum fields

## 0.6.1

### Patch Changes

- 9d0005b: Add axios utility to support better stack traces/error info for Axios
- 3da6a70: Upgrade to Node 20 and Typescript 5.2.2, cleaning up tsconfig setup

## 0.6.0

### Minor Changes

- f24754d: Updated eslint/prettier rules

### Patch Changes

- 486a5b2: Derive isOptional and relationshipType from relation instead of manually inputting
- f24754d: Upgrade to Node 18.17.1

## 0.5.1

### Patch Changes

- c4c38ec: Upgraded dependencies and remove gulp

## 0.5.0

### Minor Changes

- 5a4673f: Make auth0Id column unique instead of email to allow for multiple users with the same email

## 0.4.0

### Minor Changes

- 0027b3d: Upgrade generated dependencies to get latest and greatest

## 0.3.1

### Patch Changes

- 3f45e59: Fix changeset release process to build app before releasing

## 0.3.0

### Minor Changes

- dcd86ed: Switch all packages to ESM
- f7cb616: Switch to pnpm for package management
- d8d6b89: Shows error if opening project.json from newer client and refresh page when cli is upgraded

## 0.2.2

### Patch Changes

- ec0218a: Upgrade tsc-alias tooling

## 0.2.1

### Patch Changes

- 37d7c50: Fixed generation to replace references to @baseplate

## 0.2.0

### Minor Changes

- 5f2d7d8: Prepare Baseplate packages for release
