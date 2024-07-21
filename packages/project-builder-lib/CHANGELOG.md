# @halfdomelabs/project-builder-lib

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
