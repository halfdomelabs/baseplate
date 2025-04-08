# @halfdomelabs/code-morph

## 0.3.1

### Patch Changes

- [#486](https://github.com/halfdomelabs/baseplate/pull/486) [`2f67423`](https://github.com/halfdomelabs/baseplate/commit/2f67423a1087e7779f4c7a6423d86f1f8465d1a3) Thanks [@kingston](https://github.com/kingston)! - Switch to object pattern for buildTasks

- [#476](https://github.com/halfdomelabs/baseplate/pull/476) [`635fb23`](https://github.com/halfdomelabs/baseplate/commit/635fb234fe6f567b1c70aa1cdb139521a14e36c1) Thanks [@kingston](https://github.com/kingston)! - Refactor buildTasks to return an array of tasks instead of using a task builder

- [#467](https://github.com/halfdomelabs/baseplate/pull/467) [`ff41c01`](https://github.com/halfdomelabs/baseplate/commit/ff41c0107a22fe0c64831e19c4f79f7bbba889d1) Thanks [@kingston](https://github.com/kingston)! - Upgrade Node version to v22.14.0

## 0.3.0

### Minor Changes

- [#416](https://github.com/halfdomelabs/baseplate/pull/416) [`b18263c`](https://github.com/halfdomelabs/baseplate/commit/b18263c1a06a74c9c5456b1efb0d7171e3b747cc) Thanks [@kingston](https://github.com/kingston)! - Major refactor of code-morph to be able to be applied to multiple packages

- [#420](https://github.com/halfdomelabs/baseplate/pull/420) [`f0ee4e0`](https://github.com/halfdomelabs/baseplate/commit/f0ee4e07fc9d40947f319efb788f7fb596848231) Thanks [@kingston](https://github.com/kingston)! - Refactor generators to pass instantiated generator directly to engine instead of intermediate JSON. Note: This means deleting any descriptor JSON files from the baseplate folder for each app as they are no longer used.

### Patch Changes

- [#419](https://github.com/halfdomelabs/baseplate/pull/419) [`9f34f54`](https://github.com/halfdomelabs/baseplate/commit/9f34f54d6b6c9762f5237000c83aa9959116a282) Thanks [@kingston](https://github.com/kingston)! - Change monorepo tooling to Turborepo from NX for easier caching

## 0.2.6

### Patch Changes

- 6ca94da: Upgrade Zod to 3.24.1

## 0.2.5

### Patch Changes

- 77d9399: Upgrade ESLint to v9 and use updated Linter configurations
- dc74c47: Upgrade jscodeshift to 17.1.1

## 0.2.4

### Patch Changes

- 416f0941: Switch to ESM module resolution for backend (before syncing, run `pnpx migrate-esm-imports src baseplate/.clean` on your backend folder to minimize merge errors)

## 0.2.3

### Patch Changes

- 7c0f3638: Upgrade tsx to 4.19.1
- 92654962: Upgrade Typescript to 5.5.4 using PNPM catalog
- 8cb0ef35: Upgrade assorted dependencies

## 0.2.2

### Patch Changes

- 94feb66: Upgrade Typescript to 5.4.4
- c0b42fc: Upgrade eslint and plugins to latest v8 versions

## 0.2.1

### Patch Changes

- 4c4cf8e5: Added sorting of package.json with prettier

## 0.2.0

### Minor Changes

- 8efd325: Bumped tsx version
