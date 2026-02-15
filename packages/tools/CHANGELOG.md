# @baseplate-dev/tools

## 0.5.2

### Patch Changes

- [#755](https://github.com/halfdomelabs/baseplate/pull/755) [`02740a6`](https://github.com/halfdomelabs/baseplate/commit/02740a6e230c7fbf28fc768543353e847671c51b) Thanks [@kingston](https://github.com/kingston)! - Upgrade linting packages

  **Major version bumps:**
  - eslint: 9.32.0 → 9.39.2
  - @eslint/js: 9.32.0 → 9.39.2
  - eslint-plugin-perfectionist: 4.15.0 → 5.4.0
  - eslint-plugin-react-hooks: 5.2.0 → 7.0.1
  - eslint-plugin-unicorn: 60.0.0 → 62.0.0
  - globals: 16.4.0 → 17.3.0
  - prettier-plugin-packagejson: 2.5.19 → 3.0.0
  - storybook: 10.1.10 → 10.2.8

  **Minor/patch bumps:**
  - @vitest/eslint-plugin: 1.3.4 → 1.6.6 (tools), 1.6.5 → 1.6.6 (core-generators)
  - eslint-plugin-storybook: 10.1.10 → 10.2.3
  - prettier-plugin-tailwindcss: 0.6.14 → 0.7.2
  - typescript-eslint: 8.38.0 → 8.54.0
  - @types/eslint-plugin-jsx-a11y: 6.10.0 → 6.10.1

  **Config changes:**
  - Updated eslint-plugin-react-hooks v7 API: `configs['recommended-latest']` → `configs.flat['recommended-latest']`
  - Disabled new strict rules from react-hooks v7 (refs, set-state-in-effect, preserve-manual-memoization, incompatible-library)

## 0.5.1

## 0.5.0

### Patch Changes

- [#735](https://github.com/halfdomelabs/baseplate/pull/735) [`9b31726`](https://github.com/halfdomelabs/baseplate/commit/9b31726ee0dce77dc7b16fa334eb597d86349599) Thanks [@kingston](https://github.com/kingston)! - Support ES2023 in Vite tsconfig generators and re-enable replaceAll ESLint rule for React apps

- [#734](https://github.com/halfdomelabs/baseplate/pull/734) [`8bfc742`](https://github.com/halfdomelabs/baseplate/commit/8bfc742b8a93393a5539babfd11b97a88ee9c39e) Thanks [@kingston](https://github.com/kingston)! - Upgrade vitest to 4.0.16
  - vitest: 3.2.4 → 4.0.16
  - @vitest/eslint-plugin: 1.3.4 → 1.6.5

  Breaking changes addressed:
  - Updated `UserConfig` type to `ViteUserConfig` in vitest config files
  - Fixed mock type annotations for vitest 4.0 compatibility

## 0.4.4

## 0.4.3

## 0.4.2

### Patch Changes

- [#705](https://github.com/halfdomelabs/baseplate/pull/705) [`a173074`](https://github.com/halfdomelabs/baseplate/commit/a1730748bbbc21ea22d9d91bf28e34d2c351425b) Thanks [@kingston](https://github.com/kingston)! - Upgrade dependencies:
  - Storybook 9.0.18 → 10.1.10
  - TRPC 11.7.2 → 11.8.0
  - MCP SDK 1.23.0 → 1.25.1
  - eslint-plugin-storybook 9.0.18 → 10.1.10

## 0.4.1

## 0.4.0

## 0.3.8

## 0.3.7

## 0.3.6

## 0.3.5

## 0.3.4

### Patch Changes

- [#643](https://github.com/halfdomelabs/baseplate/pull/643) [`7d9e6d0`](https://github.com/halfdomelabs/baseplate/commit/7d9e6d01e0a9920cee4c4d499beeffc1c663494a) Thanks [@kingston](https://github.com/kingston)! - Upgrade to TypeScript 5.8 with erasable syntax only mode

  This upgrade modernizes the codebase with TypeScript 5.8, enables erasable syntax only mode for better performance, and updates runtime dependencies.

  **Key Changes:**
  - Upgraded TypeScript to version 5.8
  - Enabled `erasableSyntaxOnly` compiler option for improved build performance
  - Updated Node.js requirement to 22.18
  - Updated PNPM requirement to 10.15
  - Fixed parameter property syntax to be compatible with erasable syntax only mode

## 0.3.3

## 0.3.2

## 0.3.1

## 0.3.0

## 0.2.6

## 0.2.5

## 0.2.4

### Patch Changes

- [#606](https://github.com/halfdomelabs/baseplate/pull/606) [`ffe791f`](https://github.com/halfdomelabs/baseplate/commit/ffe791f6ab44e82c8481f3a18df9262dec71cff6) Thanks [@kingston](https://github.com/kingston)! - Add exception for filename casing for $ and - router paths

## 0.2.3

## 0.2.2

### Patch Changes

- [#588](https://github.com/halfdomelabs/baseplate/pull/588) [`c4b14f7`](https://github.com/halfdomelabs/baseplate/commit/c4b14f780e93b3dfe63863a1b78cbbaf4e4d9020) Thanks [@kingston](https://github.com/kingston)! - Add new ESLint rule `no-unused-generator-dependencies` to identify and autofix unused dependencies in `createGeneratorTask` definitions.

- [#585](https://github.com/halfdomelabs/baseplate/pull/585) [`def0b7a`](https://github.com/halfdomelabs/baseplate/commit/def0b7a202ce49a93714a8acf876ff845c2e8e24) Thanks [@kingston](https://github.com/kingston)! - Add rules for tanstack router

## 0.2.1

## 0.2.0

### Patch Changes

- [#568](https://github.com/halfdomelabs/baseplate/pull/568) [`06b4faf`](https://github.com/halfdomelabs/baseplate/commit/06b4fafaf3d2ed848d959a9911b9bfa26702d4a3) Thanks [@kingston](https://github.com/kingston)! - Enable the import-x/consistent-type-specifier-style rule to clean up type imports

## 0.1.3

### Patch Changes

- [#564](https://github.com/halfdomelabs/baseplate/pull/564) [`8631cfe`](https://github.com/halfdomelabs/baseplate/commit/8631cfec32f1e5286d6d1ab0eb0e858461672545) Thanks [@kingston](https://github.com/kingston)! - Add support for model merging the GraphQL object type

## 0.1.2

### Patch Changes

- [#560](https://github.com/halfdomelabs/baseplate/pull/560) [`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8) Thanks [@kingston](https://github.com/kingston)! - Add README files to all packages and plugins explaining their purpose within the Baseplate monorepo.

## 0.1.1

### Patch Changes

- [#559](https://github.com/halfdomelabs/baseplate/pull/559) [`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b) Thanks [@kingston](https://github.com/kingston)! - Rename workspace to @baseplate-dev/\* and reset versions to 0.1.0

- [#557](https://github.com/halfdomelabs/baseplate/pull/557) [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad) Thanks [@kingston](https://github.com/kingston)! - Update LICENSE to modified MPL-2.0 license
