# @baseplate-dev/ui-components

## 0.5.0

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.5.0

## 0.4.4

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.4.4

## 0.4.3

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.4.3

## 0.4.2

### Patch Changes

- [#697](https://github.com/halfdomelabs/baseplate/pull/697) [`11fa86f`](https://github.com/halfdomelabs/baseplate/commit/11fa86fb8e7a209175f132b1b3d59cd24cf13d54) Thanks [@kingston](https://github.com/kingston)! - Ignore \*.map files from built output in package.json

- [#705](https://github.com/halfdomelabs/baseplate/pull/705) [`a173074`](https://github.com/halfdomelabs/baseplate/commit/a1730748bbbc21ea22d9d91bf28e34d2c351425b) Thanks [@kingston](https://github.com/kingston)! - Upgrade dependencies:
  - Storybook 9.0.18 → 10.1.10
  - TRPC 11.7.2 → 11.8.0
  - MCP SDK 1.23.0 → 1.25.1
  - eslint-plugin-storybook 9.0.18 → 10.1.10
- Updated dependencies [[`11fa86f`](https://github.com/halfdomelabs/baseplate/commit/11fa86fb8e7a209175f132b1b3d59cd24cf13d54), [`4be6c7d`](https://github.com/halfdomelabs/baseplate/commit/4be6c7dc7d900c37585b93cf5bb7198de6a41f1f)]:
  - @baseplate-dev/utils@0.4.2

## 0.4.1

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.4.1

## 0.4.0

### Patch Changes

- [#681](https://github.com/halfdomelabs/baseplate/pull/681) [`d324059`](https://github.com/halfdomelabs/baseplate/commit/d3240594e1c2bc2348eb1a7e8938f97ea5f55d22) Thanks [@kingston](https://github.com/kingston)! - Wrap dialog content in an overlay to allow scrolling within other components e.g. combobox.

- Updated dependencies [[`c3c2a00`](https://github.com/halfdomelabs/baseplate/commit/c3c2a001d57a21f76e064af55941a43bedf26f18)]:
  - @baseplate-dev/utils@0.4.0

## 0.3.8

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.3.8

## 0.3.7

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.3.7

## 0.3.6

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.3.6

## 0.3.5

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.3.5

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

- Updated dependencies [[`7d9e6d0`](https://github.com/halfdomelabs/baseplate/commit/7d9e6d01e0a9920cee4c4d499beeffc1c663494a)]:
  - @baseplate-dev/utils@0.3.4

## 0.3.3

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.3.3

## 0.3.2

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.3.1

## 0.3.0

### Patch Changes

- [#627](https://github.com/halfdomelabs/baseplate/pull/627) [`aaf8634`](https://github.com/halfdomelabs/baseplate/commit/aaf8634abcf76d938072c7afc43e6e99a2519b13) Thanks [@kingston](https://github.com/kingston)! - Add AsyncComboboxField component with advanced async option loading
  - **New AsyncComboboxField component**: Provides async option loading with debounced search, race condition protection, and delayed loading indicators to prevent flashing
  - **ComboboxLoading component**: New loading state component that pairs with ComboboxEmpty for consistent async combobox experiences
  - **useDebounce hook**: Utility hook for debouncing values to improve performance in async scenarios
  - **Persistent selected values**: Selected options are cached and persist across searches, solving the common issue where selected values disappear when search results change
  - **Optional value resolution**: Added `resolveValue` prop to fetch option details when values are set externally (useful for pre-populated forms)
  - **Race condition protection**: Prevents stale results from overwriting newer search results
  - **Configurable loading delay**: Prevents loading indicator flashing for fast API responses (default 200ms delay)
  - **Comprehensive error handling**: Support for custom error formatting and graceful error states
  - **React Hook Form integration**: Full support via AsyncComboboxFieldController with proper validation
  - **Extensive Storybook examples**: Stories demonstrating all features including persistent values, error states, and loading behaviors

  This component provides a production-ready async combobox solution that handles all the edge cases and UX considerations needed for real-world applications.

- Updated dependencies []:
  - @baseplate-dev/utils@0.3.0

## 0.2.6

### Patch Changes

- [#618](https://github.com/halfdomelabs/baseplate/pull/618) [`541db59`](https://github.com/halfdomelabs/baseplate/commit/541db59ccf868b6a6fcc8fa756eab0dfa560d193) Thanks [@kingston](https://github.com/kingston)! - Add 300ms delay to loader component

- Updated dependencies []:
  - @baseplate-dev/utils@0.2.6

## 0.2.5

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/utils@0.2.5

## 0.2.4

### Patch Changes

- Updated dependencies [[`ffe791f`](https://github.com/halfdomelabs/baseplate/commit/ffe791f6ab44e82c8481f3a18df9262dec71cff6)]:
  - @baseplate-dev/utils@0.2.4

## 0.2.3

### Patch Changes

- [#597](https://github.com/halfdomelabs/baseplate/pull/597) [`903e2d8`](https://github.com/halfdomelabs/baseplate/commit/903e2d898c47e6559f55f023eb89a0b524098f3a) Thanks [@kingston](https://github.com/kingston)! - Enable tailwind-merge in cn utility by default

  Updated the cn utility function to use tailwind-merge for better class merging behavior. This change:
  - Adds tailwind-merge dependency to ui-components and react-generators packages
  - Updates cn function to use twMerge(clsx(inputs)) instead of just clsx(inputs)
  - Simplifies input styling by removing unnecessary rightPadding variant
  - Improves class conflict resolution in component styling

- [#595](https://github.com/halfdomelabs/baseplate/pull/595) [`a506e88`](https://github.com/halfdomelabs/baseplate/commit/a506e88893bf395916ef3fbf6dd9dd7c0ff17acb) Thanks [@kingston](https://github.com/kingston)! - Upgrade react-hook-form to 7.60.0

- Updated dependencies []:
  - @baseplate-dev/utils@0.2.3

## 0.2.2

### Patch Changes

- Updated dependencies [[`f8c9284`](https://github.com/halfdomelabs/baseplate/commit/f8c9284752c12c6aab70481bf98e6fa402e61075)]:
  - @baseplate-dev/utils@0.2.2

## 0.2.1

### Patch Changes

- [#583](https://github.com/halfdomelabs/baseplate/pull/583) [`4d7677e`](https://github.com/halfdomelabs/baseplate/commit/4d7677e8ef2da8ed045ee7fe409519f0f124b34c) Thanks [@kingston](https://github.com/kingston)! - Update UI for app editor

- Updated dependencies []:
  - @baseplate-dev/utils@0.2.1

## 0.2.0

### Patch Changes

- [#568](https://github.com/halfdomelabs/baseplate/pull/568) [`06b4faf`](https://github.com/halfdomelabs/baseplate/commit/06b4fafaf3d2ed848d959a9911b9bfa26702d4a3) Thanks [@kingston](https://github.com/kingston)! - Enable the import-x/consistent-type-specifier-style rule to clean up type imports

- [#579](https://github.com/halfdomelabs/baseplate/pull/579) [`3198895`](https://github.com/halfdomelabs/baseplate/commit/3198895bc45f6ff031e3d1e2c8554ddc3a30261d) Thanks [@kingston](https://github.com/kingston)! - Switch all @radix-ui/\* imports to the newer radix-ui imports

- Updated dependencies [[`06b4faf`](https://github.com/halfdomelabs/baseplate/commit/06b4fafaf3d2ed848d959a9911b9bfa26702d4a3), [`fd63554`](https://github.com/halfdomelabs/baseplate/commit/fd635544eb6df0385501f61f3e51bce554633458), [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9)]:
  - @baseplate-dev/utils@0.2.0

## 0.1.3

### Patch Changes

- [#562](https://github.com/halfdomelabs/baseplate/pull/562) [`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad) Thanks [@kingston](https://github.com/kingston)! - Switch to Typescript project references for building/watching project

- Updated dependencies [[`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad)]:
  - @baseplate-dev/utils@0.1.3

## 0.1.2

### Patch Changes

- [#560](https://github.com/halfdomelabs/baseplate/pull/560) [`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8) Thanks [@kingston](https://github.com/kingston)! - Add README files to all packages and plugins explaining their purpose within the Baseplate monorepo.

- Updated dependencies [[`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8)]:
  - @baseplate-dev/utils@0.1.2

## 0.1.1

### Patch Changes

- [#559](https://github.com/halfdomelabs/baseplate/pull/559) [`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b) Thanks [@kingston](https://github.com/kingston)! - Rename workspace to @baseplate-dev/\* and reset versions to 0.1.0

- [#557](https://github.com/halfdomelabs/baseplate/pull/557) [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad) Thanks [@kingston](https://github.com/kingston)! - Update LICENSE to modified MPL-2.0 license

- Updated dependencies [[`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b), [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad)]:
  - @baseplate-dev/utils@0.1.1
