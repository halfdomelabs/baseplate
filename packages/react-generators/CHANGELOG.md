# @baseplate-dev/react-generators

## 0.3.3

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.3.3
  - @baseplate-dev/sync@0.3.3
  - @baseplate-dev/utils@0.3.3

## 0.3.2

### Patch Changes

- [#634](https://github.com/halfdomelabs/baseplate/pull/634) [`1419a96`](https://github.com/halfdomelabs/baseplate/commit/1419a965efd41d2b2dfb86dd18f32e5414a3af85) Thanks [@kingston](https://github.com/kingston)! - Add a default pending component to router

- [#631](https://github.com/halfdomelabs/baseplate/pull/631) [`b4c15b9`](https://github.com/halfdomelabs/baseplate/commit/b4c15b98a518c53828f81624764ba693def85faf) Thanks [@kingston](https://github.com/kingston)! - Update admin generators to use new admin layout with breadcrumbs

- [#635](https://github.com/halfdomelabs/baseplate/pull/635) [`04a4978`](https://github.com/halfdomelabs/baseplate/commit/04a49785642685ca4b56aec27dc0a18520674ef9) Thanks [@kingston](https://github.com/kingston)! - Upgrade GraphQL to 16.11.0

- Updated dependencies [[`b4c15b9`](https://github.com/halfdomelabs/baseplate/commit/b4c15b98a518c53828f81624764ba693def85faf)]:
  - @baseplate-dev/core-generators@0.3.2
  - @baseplate-dev/sync@0.3.2
  - @baseplate-dev/utils@0.3.2

## 0.3.1

### Patch Changes

- [#629](https://github.com/halfdomelabs/baseplate/pull/629) [`d79b0cf`](https://github.com/halfdomelabs/baseplate/commit/d79b0cfb9061dbeccc976a2f018b264849bef788) Thanks [@kingston](https://github.com/kingston)! - Add queue plugin with pg-boss implementation

  Introduces a new queue plugin that provides background job processing capabilities for Baseplate projects. The initial implementation uses pg-boss as the queue backend, providing:
  - **Queue Plugin Architecture**: Modular queue system with provider-based implementation pattern
  - **pg-boss Integration**: PostgreSQL-based queue system with robust job processing features
  - **Type-Safe Queue Definitions**: Full TypeScript support for queue job payloads and handlers
  - **Job Management Features**:
    - Delayed job execution
    - Retry logic with configurable backoff strategies (fixed or exponential)
    - Priority-based job processing
    - Repeatable/cron jobs with schedule patterns
  - **Worker Script Generation**: Automatic generation of worker scripts for processing background jobs
  - **Queue Registry Pattern**: Centralized queue management with automatic discovery
  - **Maintenance Operations**: Configurable job retention and cleanup policies
  - **Graceful Shutdown**: Proper cleanup and job completion on worker termination

  The plugin follows Baseplate's spec-implementation pattern, allowing for future queue backends while maintaining a consistent API.

- Updated dependencies [[`d79b0cf`](https://github.com/halfdomelabs/baseplate/commit/d79b0cfb9061dbeccc976a2f018b264849bef788)]:
  - @baseplate-dev/core-generators@0.3.1
  - @baseplate-dev/sync@0.3.1
  - @baseplate-dev/utils@0.3.1

## 0.3.0

### Patch Changes

- [#623](https://github.com/halfdomelabs/baseplate/pull/623) [`82cee71`](https://github.com/halfdomelabs/baseplate/commit/82cee7183ef384e1777e7a563656441ff108e2b3) Thanks [@kingston](https://github.com/kingston)! - Remove @headlessui/react package

- [#626](https://github.com/halfdomelabs/baseplate/pull/626) [`8ec33fc`](https://github.com/halfdomelabs/baseplate/commit/8ec33fcdc8fea9cb20e79586b854bf075270ab53) Thanks [@kingston](https://github.com/kingston)! - Remove dotenv references and replace with native node --env-file option

- [#624](https://github.com/halfdomelabs/baseplate/pull/624) [`d0b08b8`](https://github.com/halfdomelabs/baseplate/commit/d0b08b89a07b9aa845212ec90e2a6123fbecbbe5) Thanks [@kingston](https://github.com/kingston)! - Upgrade Tanstack Router to 1.130.8 and revert from="/" workaround for Link bug

- [#621](https://github.com/halfdomelabs/baseplate/pull/621) [`fbde70f`](https://github.com/halfdomelabs/baseplate/commit/fbde70ffbcae025318480e9607924978847fba2b) Thanks [@kingston](https://github.com/kingston)! - Update package versions to match latest dependencies from main repo
  - Update ESLint and related plugins to latest versions
  - Update TypeScript ESLint to 8.38.0
  - Update Prettier plugins to latest versions
  - Update Tailwind CSS Prettier plugin to 0.6.14

- Updated dependencies [[`687a47e`](https://github.com/halfdomelabs/baseplate/commit/687a47e5e39abc5138ba3fc2d0db9cfee6e4dbfe), [`8ec33fc`](https://github.com/halfdomelabs/baseplate/commit/8ec33fcdc8fea9cb20e79586b854bf075270ab53), [`fbde70f`](https://github.com/halfdomelabs/baseplate/commit/fbde70ffbcae025318480e9607924978847fba2b)]:
  - @baseplate-dev/sync@0.3.0
  - @baseplate-dev/core-generators@0.3.0
  - @baseplate-dev/utils@0.3.0

## 0.2.6

### Patch Changes

- [#618](https://github.com/halfdomelabs/baseplate/pull/618) [`541db59`](https://github.com/halfdomelabs/baseplate/commit/541db59ccf868b6a6fcc8fa756eab0dfa560d193) Thanks [@kingston](https://github.com/kingston)! - Add 300ms delay to loader component

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.2.6
  - @baseplate-dev/sync@0.2.6
  - @baseplate-dev/utils@0.2.6

## 0.2.5

### Patch Changes

- [#613](https://github.com/halfdomelabs/baseplate/pull/613) [`2aae451`](https://github.com/halfdomelabs/baseplate/commit/2aae45107cb6331234d14d8a6491b55e7f6d9f33) Thanks [@kingston](https://github.com/kingston)! - Reorganize components folder structure in generated codebases

  The components folder structure has been reorganized to improve organization and reduce bundle size:

  **Breaking Changes:**
  - Removed bundle export at `components/index.ts` to prevent importing all components at once
  - Moved all UI components from `components/` to `components/ui/` folder

  **New Structure:**

  ```
  components/
  ├── ui/           # UI components
  │   ├── button.tsx
  │   ├── input.tsx
  │   └── ...
  └── [other-components]  # Custom application components
  ```

  **Migration:**
  - Replace `import { Button } from '@src/components'` with `import { Button } from '@src/components/ui/button'`
  - Update imports to use specific component paths instead of barrel exports
  - UI components are now co-located in the `ui/` subfolder for better organization

  This change improves tree-shaking, reduces bundle size, and provides clearer separation between UI library components and custom application components.

- [#608](https://github.com/halfdomelabs/baseplate/pull/608) [`01c47c7`](https://github.com/halfdomelabs/baseplate/commit/01c47c77f039a463de03271de6461cd969d5a8e8) Thanks [@kingston](https://github.com/kingston)! - Remove changeOrigin: true from vite proxy to allow custom auth plugin to work

- Updated dependencies [[`e0d690c`](https://github.com/halfdomelabs/baseplate/commit/e0d690c1e139f93a8ff60c9e0c90bc72cdf705a4), [`2aae451`](https://github.com/halfdomelabs/baseplate/commit/2aae45107cb6331234d14d8a6491b55e7f6d9f33)]:
  - @baseplate-dev/sync@0.2.5
  - @baseplate-dev/core-generators@0.2.5
  - @baseplate-dev/utils@0.2.5

## 0.2.4

### Patch Changes

- [#606](https://github.com/halfdomelabs/baseplate/pull/606) [`ffe791f`](https://github.com/halfdomelabs/baseplate/commit/ffe791f6ab44e82c8481f3a18df9262dec71cff6) Thanks [@kingston](https://github.com/kingston)! - Add exception for filename casing for $ and - router paths

- Updated dependencies [[`ffe791f`](https://github.com/halfdomelabs/baseplate/commit/ffe791f6ab44e82c8481f3a18df9262dec71cff6)]:
  - @baseplate-dev/utils@0.2.4
  - @baseplate-dev/core-generators@0.2.4
  - @baseplate-dev/sync@0.2.4

## 0.2.3

### Patch Changes

- [#594](https://github.com/halfdomelabs/baseplate/pull/594) [`3107a1b`](https://github.com/halfdomelabs/baseplate/commit/3107a1b6917c3b2d14c7e91e2972b06955ebb4ea) Thanks [@kingston](https://github.com/kingston)! - Switch to typed GraphQL documents instead of older Apollo generator

- [#598](https://github.com/halfdomelabs/baseplate/pull/598) [`69eea11`](https://github.com/halfdomelabs/baseplate/commit/69eea11c3662fbad9b8d2283d5127195c8379c07) Thanks [@kingston](https://github.com/kingston)! - Change environment names from long format to short abbreviations (development→dev, staging→stage, production→prod)

- [#597](https://github.com/halfdomelabs/baseplate/pull/597) [`903e2d8`](https://github.com/halfdomelabs/baseplate/commit/903e2d898c47e6559f55f023eb89a0b524098f3a) Thanks [@kingston](https://github.com/kingston)! - Enable tailwind-merge in cn utility by default

  Updated the cn utility function to use tailwind-merge for better class merging behavior. This change:
  - Adds tailwind-merge dependency to ui-components and react-generators packages
  - Updates cn function to use twMerge(clsx(inputs)) instead of just clsx(inputs)
  - Simplifies input styling by removing unnecessary rightPadding variant
  - Improves class conflict resolution in component styling

- [#592](https://github.com/halfdomelabs/baseplate/pull/592) [`de9e1b4`](https://github.com/halfdomelabs/baseplate/commit/de9e1b4f3a8a7dcf6b962781a0aa589eb970c7a8) Thanks [@kingston](https://github.com/kingston)! - Update auth generators to better fit with Tanstack Router

- [#595](https://github.com/halfdomelabs/baseplate/pull/595) [`a506e88`](https://github.com/halfdomelabs/baseplate/commit/a506e88893bf395916ef3fbf6dd9dd7c0ff17acb) Thanks [@kingston](https://github.com/kingston)! - Upgrade react-hook-form to 7.60.0

- Updated dependencies [[`f3bd169`](https://github.com/halfdomelabs/baseplate/commit/f3bd169b8debc52628179ca6ebd93c20b8a6f841), [`a506e88`](https://github.com/halfdomelabs/baseplate/commit/a506e88893bf395916ef3fbf6dd9dd7c0ff17acb), [`f0cb763`](https://github.com/halfdomelabs/baseplate/commit/f0cb7632f04bfb487722785fac7218d76d3b7e3b), [`059edf7`](https://github.com/halfdomelabs/baseplate/commit/059edf771755f1ff846494f238d777a9d1f7f5d7), [`059edf7`](https://github.com/halfdomelabs/baseplate/commit/059edf771755f1ff846494f238d777a9d1f7f5d7), [`de9e1b4`](https://github.com/halfdomelabs/baseplate/commit/de9e1b4f3a8a7dcf6b962781a0aa589eb970c7a8)]:
  - @baseplate-dev/core-generators@0.2.3
  - @baseplate-dev/sync@0.2.3
  - @baseplate-dev/utils@0.2.3

## 0.2.2

### Patch Changes

- [#591](https://github.com/halfdomelabs/baseplate/pull/591) [`f8c9284`](https://github.com/halfdomelabs/baseplate/commit/f8c9284752c12c6aab70481bf98e6fa402e61075) Thanks [@kingston](https://github.com/kingston)! - Migrate React generators to use Tanstack Router instead of React Router for improved type safety and developer experience

- Updated dependencies [[`f8c9284`](https://github.com/halfdomelabs/baseplate/commit/f8c9284752c12c6aab70481bf98e6fa402e61075), [`f8c9284`](https://github.com/halfdomelabs/baseplate/commit/f8c9284752c12c6aab70481bf98e6fa402e61075), [`dce88ac`](https://github.com/halfdomelabs/baseplate/commit/dce88ac8d1f951f7336c12c5e004107de3a23e97)]:
  - @baseplate-dev/utils@0.2.2
  - @baseplate-dev/sync@0.2.2
  - @baseplate-dev/core-generators@0.2.2

## 0.2.1

### Patch Changes

- [#581](https://github.com/halfdomelabs/baseplate/pull/581) [`d7d9985`](https://github.com/halfdomelabs/baseplate/commit/d7d998540ca5886259f93b5020c4d8939c5cdf5f) Thanks [@kingston](https://github.com/kingston)! - Fix settings for prettier with Tailwind v4

- Updated dependencies [[`d7d9985`](https://github.com/halfdomelabs/baseplate/commit/d7d998540ca5886259f93b5020c4d8939c5cdf5f)]:
  - @baseplate-dev/core-generators@0.2.1
  - @baseplate-dev/sync@0.2.1
  - @baseplate-dev/utils@0.2.1

## 0.2.0

### Minor Changes

- [#580](https://github.com/halfdomelabs/baseplate/pull/580) [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13) Thanks [@kingston](https://github.com/kingston)! - Refresh all UI components generated by React generators to use ShadCN components

### Patch Changes

- [#568](https://github.com/halfdomelabs/baseplate/pull/568) [`06b4faf`](https://github.com/halfdomelabs/baseplate/commit/06b4fafaf3d2ed848d959a9911b9bfa26702d4a3) Thanks [@kingston](https://github.com/kingston)! - Enable the import-x/consistent-type-specifier-style rule to clean up type imports

- [#574](https://github.com/halfdomelabs/baseplate/pull/574) [`f5d7a6f`](https://github.com/halfdomelabs/baseplate/commit/f5d7a6f781b1799bb8ad197973e5cec04f869264) Thanks [@kingston](https://github.com/kingston)! - Refactored naming of project paths to output paths to be clearer about their meaning

- [#580](https://github.com/halfdomelabs/baseplate/pull/580) [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13) Thanks [@kingston](https://github.com/kingston)! - Match tsconfig for React projects to newer Vite templates with tsconfig.app and tsconfig.node

- [#570](https://github.com/halfdomelabs/baseplate/pull/570) [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9) Thanks [@kingston](https://github.com/kingston)! - Implement phase 1 of reverse template generator v2

- Updated dependencies [[`06b4faf`](https://github.com/halfdomelabs/baseplate/commit/06b4fafaf3d2ed848d959a9911b9bfa26702d4a3), [`f5d7a6f`](https://github.com/halfdomelabs/baseplate/commit/f5d7a6f781b1799bb8ad197973e5cec04f869264), [`fd63554`](https://github.com/halfdomelabs/baseplate/commit/fd635544eb6df0385501f61f3e51bce554633458), [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13), [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9), [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13), [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9)]:
  - @baseplate-dev/core-generators@0.2.0
  - @baseplate-dev/utils@0.2.0
  - @baseplate-dev/sync@0.2.0

## 0.1.3

### Patch Changes

- [#562](https://github.com/halfdomelabs/baseplate/pull/562) [`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad) Thanks [@kingston](https://github.com/kingston)! - Switch to Typescript project references for building/watching project

- Updated dependencies [[`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad)]:
  - @baseplate-dev/core-generators@0.1.3
  - @baseplate-dev/utils@0.1.3
  - @baseplate-dev/sync@0.1.3

## 0.1.2

### Patch Changes

- [#560](https://github.com/halfdomelabs/baseplate/pull/560) [`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8) Thanks [@kingston](https://github.com/kingston)! - Add README files to all packages and plugins explaining their purpose within the Baseplate monorepo.

- Updated dependencies [[`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8)]:
  - @baseplate-dev/sync@0.1.2
  - @baseplate-dev/core-generators@0.1.2
  - @baseplate-dev/utils@0.1.2

## 0.1.1

### Patch Changes

- [#559](https://github.com/halfdomelabs/baseplate/pull/559) [`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b) Thanks [@kingston](https://github.com/kingston)! - Rename workspace to @baseplate-dev/\* and reset versions to 0.1.0

- [#557](https://github.com/halfdomelabs/baseplate/pull/557) [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad) Thanks [@kingston](https://github.com/kingston)! - Update LICENSE to modified MPL-2.0 license

- Updated dependencies [[`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b), [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad)]:
  - @baseplate-dev/core-generators@0.1.1
  - @baseplate-dev/utils@0.1.1
  - @baseplate-dev/sync@0.1.1
