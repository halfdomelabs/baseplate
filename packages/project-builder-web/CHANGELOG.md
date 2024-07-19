# @halfdomelabs/project-builder-web

## 0.11.3

### Patch Changes

- 64bc313: Fix web entry target sourcing to source plugins from source folder instead of dist
- Updated dependencies [64bc313]
  - @halfdomelabs/project-builder-lib@0.8.3

## 0.11.2

### Patch Changes

- b86ae48: Fix loading of web plugin paths
- Updated dependencies [b86ae48]
  - @halfdomelabs/project-builder-lib@0.8.2

## 0.11.1

### Patch Changes

- Updated dependencies [d8374b4]
  - @halfdomelabs/project-builder-lib@0.8.1
  - @halfdomelabs/ui-components@0.4.10

## 0.11.0

### Minor Changes

- a6f01ea: Set up new plugin architecture and migrate storage plugin to new plugin architecture

### Patch Changes

- 0cadfee: Enable plugin functionality by default
- 267b839: Upgrade Vite to 5.3.3
- 94feb66: Upgrade Typescript to 5.4.4
- ece4355: Fix flash of error after saving a new enum
- 94feb66: Upgrade React to 18.3.1
- 94feb66: Upgrade loglevel to 1.9.1
- Updated dependencies [0cadfee]
- Updated dependencies [267b839]
- Updated dependencies [94feb66]
- Updated dependencies [c0b42fc]
- Updated dependencies [a6f01ea]
  - @halfdomelabs/project-builder-lib@0.8.0
  - @halfdomelabs/ui-components@0.4.9

## 0.10.0

### Minor Changes

- 6f7b930: Implement new Baseplate design with sidebar instead of topbar

### Patch Changes

- b4f0584: Fix a bug with the unsaved changes dialog on the new enum form.
- Updated dependencies [6f7b930]
- Updated dependencies [6f7b930]
  - @halfdomelabs/project-builder-lib@0.7.6
  - @halfdomelabs/ui-components@0.4.8

## 0.9.3

### Patch Changes

- 8819162: Fixed a bug that caused a navigation blocker modal to appear when saving a model.
- 082dfc3: Upgrade Zod to 3.23.8
- 082dfc3: Lay groundwork for initial plugin system with plugin discovery [in development]
- Updated dependencies [082dfc3]
- Updated dependencies [082dfc3]
- Updated dependencies [925f887]
  - @halfdomelabs/project-builder-lib@0.7.5
  - @halfdomelabs/ui-components@0.4.7

## 0.9.2

### Patch Changes

- d07213f: feat: Update project builder web components to use useProjects hook
- a4fb47d: Update npm dependencies for tailwindcss to 3.4.3 and associated packages
- 12c83b2: Fix buggy navigation blocker.
- 377b433: Update project builder to use new color system from updated design system
- 994b7d2: Dismiss blocker dialog if no active blocker dialog present
- 9cab58f: Replace classnames with clsx.
- Updated dependencies [a4fb47d]
- Updated dependencies [377b433]
- Updated dependencies [e701e1d]
- Updated dependencies [9cab58f]
  - @halfdomelabs/ui-components@0.4.6
  - @halfdomelabs/project-builder-lib@0.7.4

## 0.9.1

### Patch Changes

- 3ffb860: Switch font to Geist Sans and Geist Mono
- Updated dependencies [3ffb860]
- Updated dependencies [3ffb860]
  - @halfdomelabs/ui-components@0.4.5

## 0.9.0

### Minor Changes

- a5bce9d: Update `react-router-dom` in Baseplate and generators.

  Refactor Project Builder Web App to use a data router to allow the `useBlocker` hook.

  Prevent navigation from dirty forms in modal and other forms.

### Patch Changes

- 6b368f5: Rename project config to project definition
- Updated dependencies [6b368f5]
  - @halfdomelabs/project-builder-lib@0.7.3

## 0.8.4

### Patch Changes

- a4949e51: Update Vite to `5.2.8`
- 4fb65f29: Fix bug with embedded form in admin CRUD UI
- fd51d48e: Update logo of Baseplate to latest
- Updated dependencies [a4949e51]
- Updated dependencies [fd51d48e]
  - @halfdomelabs/ui-components@0.4.4

## 0.8.3

### Patch Changes

- f69fbf50: Upgrade Axios to 1.6.8 to address security vuln
- f69fbf50: Upgrade vite to 5.2.4 and vitest to 1.4.0
- b28ae068: Use Confirmation Dialog in place of window.confirm
- Updated dependencies [f69fbf50]
- Updated dependencies [4c4cf8e5]
- Updated dependencies [f69fbf50]
- Updated dependencies [e7f858ce]
  - @halfdomelabs/project-builder-lib@0.7.2
  - @halfdomelabs/ui-components@0.4.3

## 0.8.2

### Patch Changes

- 427f534f: Fix changing name of model modal

## 0.8.1

### Patch Changes

- Updated dependencies [1e30f98b]
- Updated dependencies [1e30f98b]
  - @halfdomelabs/project-builder-lib@0.7.1

## 0.8.0

### Minor Changes

- e1091945: Adds fixed actions bar to bottom of model edit pages
- ae358f50: Switch over project builder to new reference system

### Patch Changes

- 0583ca1e: Enable names of entities to be references to other fields
- fdd80b5a: Improve reference errors when deleting fields/models/enums
- 0ef0915d: Fix bug with adding fields and saving schema/services
- 8c0a2d5b: Add ability to set defaults on enum fields
- af5d0c53: Upgrade react-icons to 5.0.1 and minor upgrades on component deps
- 9a9d4f2d: Upgrade Axios to 1.6.5
- Updated dependencies [0583ca1e]
- Updated dependencies [fdd80b5a]
- Updated dependencies [0ef0915d]
- Updated dependencies [33f9df9e]
- Updated dependencies [8c0a2d5b]
- Updated dependencies [af5d0c53]
- Updated dependencies [ae358f50]
  - @halfdomelabs/project-builder-lib@0.7.0
  - @halfdomelabs/ui-components@0.4.2

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
