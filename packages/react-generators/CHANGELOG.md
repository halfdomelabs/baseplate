# @baseplate-dev/react-generators

## 0.5.2

### Patch Changes

- [#761](https://github.com/halfdomelabs/baseplate/pull/761) [`b4db947`](https://github.com/halfdomelabs/baseplate/commit/b4db947f256c4b8639d7f18ffb58bb2b1646c497) Thanks [@kingston](https://github.com/kingston)! - Add configurable development ports for apps with automatic assignment and conflict validation

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

- [#756](https://github.com/halfdomelabs/baseplate/pull/756) [`dd40bcd`](https://github.com/halfdomelabs/baseplate/commit/dd40bcd219c79f0cd7b66c0427c77deda0664072) Thanks [@kingston](https://github.com/kingston)! - Upgrade packages to fix security vulnerabilities and update to latest versions

  **Security fixes:**
  - @modelcontextprotocol/sdk: 1.25.1 → 1.26.0 (fixes CVE-2026-25536 - cross-client data leak)
  - fastify: 5.6.2 → 5.7.4 (security patches)
  - diff: 8.0.2 → 8.0.3 (fixes CVE-2026-24001 - DoS vulnerability)
  - testcontainers: 11.10.0 → 11.11.0 (fixes undici vulnerability)

  **Package updates (monorepo):**
  - @tailwindcss/vite: 4.1.13 → 4.1.18
  - tailwindcss: 4.1.13 → 4.1.18
  - @tanstack/react-router: 1.139.7 → 1.159.5
  - @tanstack/router-plugin: 1.139.7 → 1.159.5
  - @testing-library/jest-dom: 6.6.3 → 6.9.1
  - concurrently: 9.0.1 → 9.2.1
  - ts-morph: 26.0.0 → 27.0.2

  **Package updates (generated projects):**
  - prisma/@prisma/client/@prisma/adapter-pg: 7.2.0 → 7.4.0
  - postmark: 4.0.2 → 4.0.5
  - axios: 1.12.0 → 1.13.5

- Updated dependencies [[`02740a6`](https://github.com/halfdomelabs/baseplate/commit/02740a6e230c7fbf28fc768543353e847671c51b), [`dd40bcd`](https://github.com/halfdomelabs/baseplate/commit/dd40bcd219c79f0cd7b66c0427c77deda0664072), [`7d1a9d6`](https://github.com/halfdomelabs/baseplate/commit/7d1a9d6d381279434f2ac632e9f8accde34dda25), [`63bd074`](https://github.com/halfdomelabs/baseplate/commit/63bd074b3b24b0978d4271a5bc76a8531b0f60c2)]:
  - @baseplate-dev/core-generators@0.5.2
  - @baseplate-dev/sync@0.5.2
  - @baseplate-dev/utils@0.5.2

## 0.5.1

### Patch Changes

- [#743](https://github.com/halfdomelabs/baseplate/pull/743) [`1debcb8`](https://github.com/halfdomelabs/baseplate/commit/1debcb89807fafdd7415a659f4bebbad0d69f072) Thanks [@kingston](https://github.com/kingston)! - Add gql:check and gql:generate commands to package.json and add typescript to root repo

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.5.1
  - @baseplate-dev/sync@0.5.1
  - @baseplate-dev/utils@0.5.1

## 0.5.0

### Minor Changes

- [#730](https://github.com/halfdomelabs/baseplate/pull/730) [`397018b`](https://github.com/halfdomelabs/baseplate/commit/397018b8c30949f75734369b58c67d7afcc424a9) Thanks [@kingston](https://github.com/kingston)! - Migrate GraphQL codegen from graphql-codegen to gql.tada
  - Replace separate `.gql` files and generated `graphql.tsx` with inline `graphql()` template literals
  - Add gql.tada TypeScript plugin for automatic type generation via `graphql-env.d.ts`
  - Add `@graphql-eslint/eslint-plugin` with naming convention rules for operations and fragments
  - Colocate fragments with their consuming components using `ComponentName_field` naming pattern
  - Use `readFragment()` and `FragmentOf<>` for proper fragment masking
  - Extract shared queries to dedicated `queries.ts` files to avoid circular imports

### Patch Changes

- [#735](https://github.com/halfdomelabs/baseplate/pull/735) [`9b31726`](https://github.com/halfdomelabs/baseplate/commit/9b31726ee0dce77dc7b16fa334eb597d86349599) Thanks [@kingston](https://github.com/kingston)! - Support ES2023 in Vite tsconfig generators and re-enable replaceAll ESLint rule for React apps

- Updated dependencies [[`fbabdec`](https://github.com/halfdomelabs/baseplate/commit/fbabdecf6715c21799d1c224b3a2162ef1f49797), [`9b31726`](https://github.com/halfdomelabs/baseplate/commit/9b31726ee0dce77dc7b16fa334eb597d86349599), [`97bd14e`](https://github.com/halfdomelabs/baseplate/commit/97bd14e381206b54e55c22264d1d406e83146146), [`c7d373e`](https://github.com/halfdomelabs/baseplate/commit/c7d373ebaaeda2522515fdaeae0d37d0cd9ce7fe), [`2d5abd5`](https://github.com/halfdomelabs/baseplate/commit/2d5abd53fccfc2b15f8142fc796c5e4ea4c2f92a), [`8bfc742`](https://github.com/halfdomelabs/baseplate/commit/8bfc742b8a93393a5539babfd11b97a88ee9c39e)]:
  - @baseplate-dev/core-generators@0.5.0
  - @baseplate-dev/sync@0.5.0
  - @baseplate-dev/utils@0.5.0

## 0.4.4

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.4.4
  - @baseplate-dev/sync@0.4.4
  - @baseplate-dev/utils@0.4.4

## 0.4.3

### Patch Changes

- [#717](https://github.com/halfdomelabs/baseplate/pull/717) [`83e4e7f`](https://github.com/halfdomelabs/baseplate/commit/83e4e7f60adf67480cebb4ff419c015ff282010d) Thanks [@kingston](https://github.com/kingston)! - Add support for generating vitest on web apps

- [#722](https://github.com/halfdomelabs/baseplate/pull/722) [`8622c4e`](https://github.com/halfdomelabs/baseplate/commit/8622c4e2b91788ad4a368c9f06f82a17ee1a29ed) Thanks [@kingston](https://github.com/kingston)! - Add support for generating files in package.json

- [#717](https://github.com/halfdomelabs/baseplate/pull/717) [`83e4e7f`](https://github.com/halfdomelabs/baseplate/commit/83e4e7f60adf67480cebb4ff419c015ff282010d) Thanks [@kingston](https://github.com/kingston)! - Upgrade Apollo Client to v4
  - @apollo/client: 3.13.8 → 4.0.11
  - Add rxjs 7.8.2 as peer dependency (required by Apollo Client v4)

  Breaking changes in generated code:
  - React hooks (useQuery, useMutation, useApolloClient, etc.) now import from `@apollo/client/react` instead of `@apollo/client`
  - ApolloProvider now imports from `@apollo/client/react`
  - Error handling uses new `CombinedGraphQLErrors` and `ServerError` classes from `@apollo/client/errors`
  - `ErrorLink` class replaces deprecated `onError` function
  - `ApolloClient` is no longer generic (use `ApolloClient` instead of `ApolloClient<NormalizedCacheObject>`)

- Updated dependencies [[`83e4e7f`](https://github.com/halfdomelabs/baseplate/commit/83e4e7f60adf67480cebb4ff419c015ff282010d), [`8622c4e`](https://github.com/halfdomelabs/baseplate/commit/8622c4e2b91788ad4a368c9f06f82a17ee1a29ed)]:
  - @baseplate-dev/core-generators@0.4.3
  - @baseplate-dev/sync@0.4.3
  - @baseplate-dev/utils@0.4.3

## 0.4.2

### Patch Changes

- [#701](https://github.com/halfdomelabs/baseplate/pull/701) [`e8576b9`](https://github.com/halfdomelabs/baseplate/commit/e8576b9ba5912acf9d81bcc1b18a0fbc8df91220) Thanks [@kingston](https://github.com/kingston)! - Upgrade to Zod v4

- [#697](https://github.com/halfdomelabs/baseplate/pull/697) [`11fa86f`](https://github.com/halfdomelabs/baseplate/commit/11fa86fb8e7a209175f132b1b3d59cd24cf13d54) Thanks [@kingston](https://github.com/kingston)! - Ignore \*.map files from built output in package.json

- [#712](https://github.com/halfdomelabs/baseplate/pull/712) [`ae2aba1`](https://github.com/halfdomelabs/baseplate/commit/ae2aba1f31c35c306cc459e0efe5e3612ece5c94) Thanks [@kingston](https://github.com/kingston)! - Add aria-[current=page] as a supported active state to the sidebar menu button component, in addition to the existing data-[active=true] attribute.

- [#701](https://github.com/halfdomelabs/baseplate/pull/701) [`e8576b9`](https://github.com/halfdomelabs/baseplate/commit/e8576b9ba5912acf9d81bcc1b18a0fbc8df91220) Thanks [@kingston](https://github.com/kingston)! - Upgrade @tanstack/react-router to 1.139.7

- Updated dependencies [[`795ee4c`](https://github.com/halfdomelabs/baseplate/commit/795ee4c18e7b393fb9247ced23a12de5e219ab15), [`e8576b9`](https://github.com/halfdomelabs/baseplate/commit/e8576b9ba5912acf9d81bcc1b18a0fbc8df91220), [`11fa86f`](https://github.com/halfdomelabs/baseplate/commit/11fa86fb8e7a209175f132b1b3d59cd24cf13d54), [`74529e7`](https://github.com/halfdomelabs/baseplate/commit/74529e7fffae8a70f8cfe801a1897204d010e291), [`4be6c7d`](https://github.com/halfdomelabs/baseplate/commit/4be6c7dc7d900c37585b93cf5bb7198de6a41f1f), [`4be6c7d`](https://github.com/halfdomelabs/baseplate/commit/4be6c7dc7d900c37585b93cf5bb7198de6a41f1f)]:
  - @baseplate-dev/sync@0.4.2
  - @baseplate-dev/core-generators@0.4.2
  - @baseplate-dev/utils@0.4.2

## 0.4.1

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.4.1
  - @baseplate-dev/sync@0.4.1
  - @baseplate-dev/utils@0.4.1

## 0.4.0

### Patch Changes

- [#685](https://github.com/halfdomelabs/baseplate/pull/685) [`a6274e9`](https://github.com/halfdomelabs/baseplate/commit/a6274e98e2f56cdac23e9ff2bc338946a569a65c) Thanks [@kingston](https://github.com/kingston)! - Upgrade vite to 7.1.12

- Updated dependencies [[`839cbdf`](https://github.com/halfdomelabs/baseplate/commit/839cbdfc6ddc059aa86d24bf6ec5d8e95cce9042), [`c3c2a00`](https://github.com/halfdomelabs/baseplate/commit/c3c2a001d57a21f76e064af55941a43bedf26f18), [`c3c2a00`](https://github.com/halfdomelabs/baseplate/commit/c3c2a001d57a21f76e064af55941a43bedf26f18), [`6daff18`](https://github.com/halfdomelabs/baseplate/commit/6daff18a033d2d78746984edebba4d8c6fe957a5)]:
  - @baseplate-dev/sync@0.4.0
  - @baseplate-dev/core-generators@0.4.0
  - @baseplate-dev/utils@0.4.0

## 0.3.8

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.3.8
  - @baseplate-dev/sync@0.3.8
  - @baseplate-dev/utils@0.3.8

## 0.3.7

### Patch Changes

- [#666](https://github.com/halfdomelabs/baseplate/pull/666) [`9508a8e`](https://github.com/halfdomelabs/baseplate/commit/9508a8ee75e33ea0c0632f3f5ef5621b020f530d) Thanks [@kingston](https://github.com/kingston)! - Add eslint-disable comment for document.cookie usage in sidebar component to ensure browser compatibility

- Updated dependencies [[`9508a8e`](https://github.com/halfdomelabs/baseplate/commit/9508a8ee75e33ea0c0632f3f5ef5621b020f530d)]:
  - @baseplate-dev/core-generators@0.3.7
  - @baseplate-dev/sync@0.3.7
  - @baseplate-dev/utils@0.3.7

## 0.3.6

### Patch Changes

- [#661](https://github.com/halfdomelabs/baseplate/pull/661) [`354b975`](https://github.com/halfdomelabs/baseplate/commit/354b9754e126f4e9f6f4cda0ac4e5f7ca15c0160) Thanks [@kingston](https://github.com/kingston)! - Upgrade Vite to 7.1.5 and related packages
  - vite: 6.3.5 → 7.1.5
  - @vitejs/plugin-react: 4.4.1 → 5.0.2
  - @tailwindcss/vite: 4.1.6 → 4.1.13
  - tailwindcss: 4.1.6 → 4.1.13
  - vite-plugin-svgr: 4.3.0 → 4.5.0

  This upgrade brings the latest Vite 7 features and ensures compatibility with all related build tooling. No breaking changes for generated projects.

  See https://vite.dev/guide/migration.html

- Updated dependencies [[`1186a21`](https://github.com/halfdomelabs/baseplate/commit/1186a21df267d112a84a42ff1d3c87b495452ce0)]:
  - @baseplate-dev/core-generators@0.3.6
  - @baseplate-dev/sync@0.3.6
  - @baseplate-dev/utils@0.3.6

## 0.3.5

### Patch Changes

- [#656](https://github.com/halfdomelabs/baseplate/pull/656) [`6d0be95`](https://github.com/halfdomelabs/baseplate/commit/6d0be954ba866414fb673694a72e73ab433c7b12) Thanks [@kingston](https://github.com/kingston)! - Use nullish coalescing operator for Unknown Item in foreign column display

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.3.5
  - @baseplate-dev/sync@0.3.5
  - @baseplate-dev/utils@0.3.5

## 0.3.4

### Patch Changes

- [#646](https://github.com/halfdomelabs/baseplate/pull/646) [`67dba69`](https://github.com/halfdomelabs/baseplate/commit/67dba697439e6bc76b81522c133d920af4dbdbb1) Thanks [@kingston](https://github.com/kingston)! - Upgrade Zod to 3.25.76

- [#643](https://github.com/halfdomelabs/baseplate/pull/643) [`7d9e6d0`](https://github.com/halfdomelabs/baseplate/commit/7d9e6d01e0a9920cee4c4d499beeffc1c663494a) Thanks [@kingston](https://github.com/kingston)! - Upgrade to TypeScript 5.8 with erasable syntax only mode

  This upgrade modernizes the codebase with TypeScript 5.8, enables erasable syntax only mode for better performance, and updates runtime dependencies.

  **Key Changes:**
  - Upgraded TypeScript to version 5.8
  - Enabled `erasableSyntaxOnly` compiler option for improved build performance
  - Updated Node.js requirement to 22.18
  - Updated PNPM requirement to 10.15
  - Fixed parameter property syntax to be compatible with erasable syntax only mode

- Updated dependencies [[`67dba69`](https://github.com/halfdomelabs/baseplate/commit/67dba697439e6bc76b81522c133d920af4dbdbb1), [`7d9e6d0`](https://github.com/halfdomelabs/baseplate/commit/7d9e6d01e0a9920cee4c4d499beeffc1c663494a)]:
  - @baseplate-dev/sync@0.3.4
  - @baseplate-dev/core-generators@0.3.4
  - @baseplate-dev/utils@0.3.4

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
