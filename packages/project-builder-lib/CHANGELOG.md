# @halfdomelabs/project-builder-lib

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
