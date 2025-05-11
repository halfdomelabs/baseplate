# @halfdomelabs/tools

## 0.5.14

### Patch Changes

- [#541](https://github.com/halfdomelabs/baseplate/pull/541) [`1446ebb`](https://github.com/halfdomelabs/baseplate/commit/1446ebb42c149d71f5c1974eb6e963aa8dd79f39) Thanks [@kingston](https://github.com/kingston)! - Update rules for eslint to better match new rules

## 0.5.13

### Patch Changes

- [#491](https://github.com/halfdomelabs/baseplate/pull/491) [`0220038`](https://github.com/halfdomelabs/baseplate/commit/02200385aa81242ca3a960d658262b6532357574) Thanks [@kingston](https://github.com/kingston)! - Support template extractor functionality on web/CLI

## 0.5.12

### Patch Changes

- [#468](https://github.com/halfdomelabs/baseplate/pull/468) [`3c79212`](https://github.com/halfdomelabs/baseplate/commit/3c79212caf68341e61f5e6a9a9d0f3a840ea964b) Thanks [@kingston](https://github.com/kingston)! - Upgrade PNPM to 10.6.5

  Breaking Change: See https://github.com/pnpm/pnpm/releases/tag/v10.0.0 for
  breaking changes to PNPM

  This breaks certain things such as lifecycle scripts and hoisting of
  ESLint/Prettier plugins and so should be observed carefully.

- [#467](https://github.com/halfdomelabs/baseplate/pull/467) [`ff41c01`](https://github.com/halfdomelabs/baseplate/commit/ff41c0107a22fe0c64831e19c4f79f7bbba889d1) Thanks [@kingston](https://github.com/kingston)! - Upgrade Node version to v22.14.0

## 0.5.11

### Patch Changes

- [#419](https://github.com/halfdomelabs/baseplate/pull/419) [`9f34f54`](https://github.com/halfdomelabs/baseplate/commit/9f34f54d6b6c9762f5237000c83aa9959116a282) Thanks [@kingston](https://github.com/kingston)! - Change monorepo tooling to Turborepo from NX for easier caching

- [#406](https://github.com/halfdomelabs/baseplate/pull/406) [`cd92861`](https://github.com/halfdomelabs/baseplate/commit/cd92861d764380264dcc7d480407edf618421e70) Thanks [@kingston](https://github.com/kingston)! - Upgrade ESLint to 9.17 and Prettier to 3.4 (and associated plugins)

## 0.5.10

### Patch Changes

- 77d9399: Upgrade ESLint to v9 and use updated Linter configurations

## 0.5.9

### Patch Changes

- 92654962: Upgrade Typescript to 5.5.4 using PNPM catalog
- 92c1401f: Upgrade vitest to 2.1.1 and vite to 5.4.7 and @types/react to 18.3.8
- 8cb0ef35: Upgrade assorted dependencies

## 0.5.8

### Patch Changes

- ddbbead: Upgrade vitest to 2.0.3

## 0.5.7

### Patch Changes

- 94feb66: Upgrade Typescript to 5.4.4
- c0b42fc: Upgrade eslint and plugins to latest v8 versions

## 0.5.6

### Patch Changes

- 3f95dc6: Upgrade prettier to 3.2.5

## 0.5.5

### Patch Changes

- a4fb47d: Update npm dependencies for tailwindcss to 3.4.3 and associated packages
- 377b433: Update project builder to use new color system from updated design system
- 9cab58f: Replace classnames with clsx.

## 0.5.4

### Patch Changes

- 922f0bf9: Upgrade prettier plugins and fix bug when prettier plugins were not present

## 0.5.3

### Patch Changes

- f69fbf50: Upgrade vite to 5.2.4 and vitest to 1.4.0
- 4c4cf8e5: Added sorting of package.json with prettier

## 0.5.2

### Patch Changes

- af5d0c53: Switch from module resolution Node to Bundler and standardized tsconfig for React generators

## 0.5.1

### Patch Changes

- 3da6a70: Upgrade to Node 20 and Typescript 5.2.2, cleaning up tsconfig setup

## 0.5.0

### Minor Changes

- 99b436a: Updated eslint/prettier and use new import order rules
- f24754d: Updated eslint/prettier rules

### Patch Changes

- f24754d: Upgrade to Node 18.17.1

## 0.4.1

### Patch Changes

- c4c38ec: Upgraded dependencies and remove gulp

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

## 0.2.0

### Minor Changes

- 5f2d7d8: Prepare Baseplate packages for release
