# @halfdomelabs/project-builder-web

## 0.7.0

### Minor Changes

- 5bcf4fd: Clears Console on retry of sync
- bab0c31: Change to TRPC for communication instead of REST

### Patch Changes

- 9d0005b: Add axios utility to support better stack traces/error info for Axios
- 3da6a70: Upgrade to Node 20 and Typescript 5.2.2, cleaning up tsconfig setup
- f12e2c1: Upgrade Vite to 4.5.1
- Updated dependencies [9d0005b]
- Updated dependencies [3da6a70]
- Updated dependencies [f12e2c1]
  - @halfdomelabs/project-builder-lib@0.6.1
  - @halfdomelabs/ui-components@0.4.1

## 0.6.0

### Minor Changes

- 0275a54: Switches Dialog to Shadcn component
- b43f6e6: Switched Tabs component to shadcn
- f24754d: Updated eslint/prettier rules
- 99b436a: Add beta of theme editor for customizing colors

### Patch Changes

- 486a5b2: Derive isOptional and relationshipType from relation instead of manually inputting
- 33aed0b: Fix renaming of fields not renaming relations
- f24754d: Upgrade to Node 18.17.1
- Updated dependencies [52c5b57]
- Updated dependencies [99b436a]
- Updated dependencies [486a5b2]
- Updated dependencies [f24754d]
- Updated dependencies [0275a54]
- Updated dependencies [b43f6e6]
- Updated dependencies [f24754d]
  - @halfdomelabs/ui-components@0.4.0
  - @halfdomelabs/project-builder-lib@0.6.0

## 0.5.1

### Patch Changes

- c4c38ec: Upgraded dependencies and remove gulp
- Updated dependencies [c4c38ec]
  - @halfdomelabs/project-builder-lib@0.5.1
  - @halfdomelabs/ui-components@0.3.2

## 0.5.0

### Minor Changes

- 08a2746: Switch generation from yarn v1 to pnpm for faster build times (run pnpm import - https://medium.com/frontendweb/how-to-manage-multiple-nodejs-versions-with-pnpm-8bcce90abedb)

### Patch Changes

- 4673336: Fix race condition with saving file and syncing
- 154eaa9: Add new tabbed interface between models/enums in UI
- Updated dependencies [154eaa9]
- Updated dependencies [5a4673f]
  - @halfdomelabs/ui-components@0.3.1
  - @halfdomelabs/project-builder-lib@0.5.0

## 0.4.0

### Minor Changes

- a81b46f: Adds new drag and drop sortable list feature
- 0027b3d: Upgrade generated dependencies to get latest and greatest

### Patch Changes

- c9c6d57: Fix changing the model/enum from a new one
- 8b575b8: Fix renaming references failing
- Updated dependencies [0027b3d]
- Updated dependencies [5f80999]
  - @halfdomelabs/project-builder-lib@0.4.0
  - @halfdomelabs/ui-components@0.3.0

## 0.3.1

### Patch Changes

- 3f45e59: Fix changeset release process to build app before releasing
- Updated dependencies [3f45e59]
  - @halfdomelabs/project-builder-lib@0.3.1
  - @halfdomelabs/ui-components@0.2.1

## 0.3.0

### Minor Changes

- f43b2c3: A new retry sync button was added to the SyncProjectModal
- dcd86ed: Switch all packages to ESM
- 16c4d68: Add updated UI for model fields editing
- f7cb616: Switch to pnpm for package management
- d8d6b89: Shows error if opening project.json from newer client and refresh page when cli is upgraded
- 483215a: Improve UI for adding/editing single field relations
- 206f2ab: Reorganization of project-builder-web layout

### Patch Changes

- Updated dependencies [dcd86ed]
- Updated dependencies [483215a]
- Updated dependencies [f7cb616]
- Updated dependencies [d8d6b89]
  - @halfdomelabs/project-builder-lib@0.3.0
  - @halfdomelabs/ui-components@0.2.0

## 0.2.2

### Patch Changes

- Updated dependencies [ec0218a]
  - @halfdomelabs/project-builder-lib@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies [37d7c50]
  - @halfdomelabs/project-builder-lib@0.2.1

## 0.2.0

### Minor Changes

- 5f2d7d8: Prepare Baseplate packages for release

### Patch Changes

- Updated dependencies [5f2d7d8]
  - @halfdomelabs/project-builder-lib@0.2.0
