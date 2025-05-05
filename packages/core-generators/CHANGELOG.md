# @halfdomelabs/core-generators

## 0.11.3

### Patch Changes

- [#523](https://github.com/halfdomelabs/baseplate/pull/523) [`a74e788`](https://github.com/halfdomelabs/baseplate/commit/a74e788dbd2987cf0be786ce3da7095c96965350) Thanks [@kingston](https://github.com/kingston)! - Stabilize ordering of various generators to ensure generation is independent of any step ordering

- [#520](https://github.com/halfdomelabs/baseplate/pull/520) [`4e691a0`](https://github.com/halfdomelabs/baseplate/commit/4e691a06458b3b17f44b80a113d77d551c1ec7f9) Thanks [@kingston](https://github.com/kingston)! - Refactor remaining Fastify generators + baseplate storage plugin

- [#516](https://github.com/halfdomelabs/baseplate/pull/516) [`85dc19e`](https://github.com/halfdomelabs/baseplate/commit/85dc19e9938db676c50cb9ccec17afe442e6c979) Thanks [@kingston](https://github.com/kingston)! - Refactor Prisma generators to use new ts templates

- Updated dependencies [[`25dde93`](https://github.com/halfdomelabs/baseplate/commit/25dde93545bfab47df44cd82ce64a8d4e26b7a25), [`4695cbe`](https://github.com/halfdomelabs/baseplate/commit/4695cbe9759a5743b421cfe0dd9e87c991d9e652), [`a74e788`](https://github.com/halfdomelabs/baseplate/commit/a74e788dbd2987cf0be786ce3da7095c96965350), [`85dc19e`](https://github.com/halfdomelabs/baseplate/commit/85dc19e9938db676c50cb9ccec17afe442e6c979), [`25dde93`](https://github.com/halfdomelabs/baseplate/commit/25dde93545bfab47df44cd82ce64a8d4e26b7a25), [`a74e788`](https://github.com/halfdomelabs/baseplate/commit/a74e788dbd2987cf0be786ce3da7095c96965350), [`4695cbe`](https://github.com/halfdomelabs/baseplate/commit/4695cbe9759a5743b421cfe0dd9e87c991d9e652)]:
  - @halfdomelabs/utils@0.1.6
  - @halfdomelabs/sync@0.11.1

## 0.11.2

### Patch Changes

- [#512](https://github.com/halfdomelabs/baseplate/pull/512) [`145a80c`](https://github.com/halfdomelabs/baseplate/commit/145a80cc348f858d4fdca218c658c490afe4271a) Thanks [@kingston](https://github.com/kingston)! - Fix global setup script path to be relative to src

## 0.11.1

### Patch Changes

- [#496](https://github.com/halfdomelabs/baseplate/pull/496) [`e544158`](https://github.com/halfdomelabs/baseplate/commit/e544158fabf02859b5475e75c43979cab67ff3f9) Thanks [@kingston](https://github.com/kingston)! - Introduce reverse generation engine for Typescript

- Updated dependencies [[`40f5fc2`](https://github.com/halfdomelabs/baseplate/commit/40f5fc2c573669d90383e728667acaabddc397af), [`0220038`](https://github.com/halfdomelabs/baseplate/commit/02200385aa81242ca3a960d658262b6532357574), [`9cee1f3`](https://github.com/halfdomelabs/baseplate/commit/9cee1f308f887e0baf06a1478c4785234f3c5aa9), [`40f5fc2`](https://github.com/halfdomelabs/baseplate/commit/40f5fc2c573669d90383e728667acaabddc397af), [`f5956dd`](https://github.com/halfdomelabs/baseplate/commit/f5956ddf8835c3e7eca0b25a20d3d4fab54fcef2), [`e544158`](https://github.com/halfdomelabs/baseplate/commit/e544158fabf02859b5475e75c43979cab67ff3f9)]:
  - @halfdomelabs/sync@0.11.0
  - @halfdomelabs/utils@0.1.5

## 0.11.0

### Minor Changes

- [#484](https://github.com/halfdomelabs/baseplate/pull/484) [`014b140`](https://github.com/halfdomelabs/baseplate/commit/014b140bcdb959bd4dc34af4af1e57b9b529a9b1) Thanks [@kingston](https://github.com/kingston)! - Add dynamic task support for generators and adapt Typescript file writer to a dynamic task

### Patch Changes

- [#473](https://github.com/halfdomelabs/baseplate/pull/473) [`24fed42`](https://github.com/halfdomelabs/baseplate/commit/24fed4249dfe3ef9d0df1b4cf1cf3e45173dd730) Thanks [@kingston](https://github.com/kingston)! - Introduce new generator concept of output providers that replace task dependencies

- [#472](https://github.com/halfdomelabs/baseplate/pull/472) [`e1517d0`](https://github.com/halfdomelabs/baseplate/commit/e1517d099001d7215c61f5f98493dfd0acb99a03) Thanks [@kingston](https://github.com/kingston)! - Lay foundations for new typescript writer system

- [#485](https://github.com/halfdomelabs/baseplate/pull/485) [`73b0006`](https://github.com/halfdomelabs/baseplate/commit/73b000601ed300774f045db02d67fbcf5167cc2b) Thanks [@kingston](https://github.com/kingston)! - Refactor node generator to allow for more ergonomic usage

- [#468](https://github.com/halfdomelabs/baseplate/pull/468) [`3c79212`](https://github.com/halfdomelabs/baseplate/commit/3c79212caf68341e61f5e6a9a9d0f3a840ea964b) Thanks [@kingston](https://github.com/kingston)! - Upgrade PNPM to 10.6.5

  Breaking Change: See https://github.com/pnpm/pnpm/releases/tag/v10.0.0 for
  breaking changes to PNPM

  This breaks certain things such as lifecycle scripts and hoisting of
  ESLint/Prettier plugins and so should be observed carefully.

- [#485](https://github.com/halfdomelabs/baseplate/pull/485) [`73b0006`](https://github.com/halfdomelabs/baseplate/commit/73b000601ed300774f045db02d67fbcf5167cc2b) Thanks [@kingston](https://github.com/kingston)! - Refactor generation methods to enable better unit testing of generator tasks

- [#486](https://github.com/halfdomelabs/baseplate/pull/486) [`2f67423`](https://github.com/halfdomelabs/baseplate/commit/2f67423a1087e7779f4c7a6423d86f1f8465d1a3) Thanks [@kingston](https://github.com/kingston)! - Switch to object pattern for buildTasks

- [#476](https://github.com/halfdomelabs/baseplate/pull/476) [`635fb23`](https://github.com/halfdomelabs/baseplate/commit/635fb234fe6f567b1c70aa1cdb139521a14e36c1) Thanks [@kingston](https://github.com/kingston)! - Refactor buildTasks to return an array of tasks instead of using a task builder

- [#467](https://github.com/halfdomelabs/baseplate/pull/467) [`ff41c01`](https://github.com/halfdomelabs/baseplate/commit/ff41c0107a22fe0c64831e19c4f79f7bbba889d1) Thanks [@kingston](https://github.com/kingston)! - Upgrade Node version to v22.14.0

- Updated dependencies [[`24fed42`](https://github.com/halfdomelabs/baseplate/commit/24fed4249dfe3ef9d0df1b4cf1cf3e45173dd730), [`e1517d0`](https://github.com/halfdomelabs/baseplate/commit/e1517d099001d7215c61f5f98493dfd0acb99a03), [`014b140`](https://github.com/halfdomelabs/baseplate/commit/014b140bcdb959bd4dc34af4af1e57b9b529a9b1), [`f684e64`](https://github.com/halfdomelabs/baseplate/commit/f684e64646e026c1d60223433ffb8ba2432d1033), [`80b9a21`](https://github.com/halfdomelabs/baseplate/commit/80b9a21bf031de47988997497aea99c7e34ba5ed), [`73b0006`](https://github.com/halfdomelabs/baseplate/commit/73b000601ed300774f045db02d67fbcf5167cc2b), [`3f9b186`](https://github.com/halfdomelabs/baseplate/commit/3f9b186b992a345fbbbd4c3ec56acc69314e07fe), [`c6caf6b`](https://github.com/halfdomelabs/baseplate/commit/c6caf6bb118b51643e67196b0a2c94973a1c8fb2), [`2f67423`](https://github.com/halfdomelabs/baseplate/commit/2f67423a1087e7779f4c7a6423d86f1f8465d1a3), [`635fb23`](https://github.com/halfdomelabs/baseplate/commit/635fb234fe6f567b1c70aa1cdb139521a14e36c1), [`ff41c01`](https://github.com/halfdomelabs/baseplate/commit/ff41c0107a22fe0c64831e19c4f79f7bbba889d1)]:
  - @halfdomelabs/utils@0.1.4
  - @halfdomelabs/sync@0.10.0

## 0.10.6

### Patch Changes

- [#454](https://github.com/halfdomelabs/baseplate/pull/454) [`5ef58cd`](https://github.com/halfdomelabs/baseplate/commit/5ef58cd9d17a94ff260457b7bc6c96c85d921f7e) Thanks [@kingston](https://github.com/kingston)! - Upgrade axios to 1.8.3

## 0.10.5

### Patch Changes

- Updated dependencies [[`4785487`](https://github.com/halfdomelabs/baseplate/commit/4785487474947affa0818280cb1a75da5a3b48ba)]:
  - @halfdomelabs/sync@0.9.2

## 0.10.4

### Patch Changes

- Updated dependencies [[`a7307cd`](https://github.com/halfdomelabs/baseplate/commit/a7307cdd2da73c9b7e02a23835eefe32ebed95d0)]:
  - @halfdomelabs/utils@0.1.3
  - @halfdomelabs/sync@0.9.1

## 0.10.3

### Patch Changes

- [#437](https://github.com/halfdomelabs/baseplate/pull/437) [`dcbf847`](https://github.com/halfdomelabs/baseplate/commit/dcbf84709856f5fc7a8e5240c3f83ab8df88254e) Thanks [@kingston](https://github.com/kingston)! - Consolidate package versions into a single constants file for easier updating

- [#441](https://github.com/halfdomelabs/baseplate/pull/441) [`ed229ab`](https://github.com/halfdomelabs/baseplate/commit/ed229ab6688969e3eb2230ea7caf273916e68291) Thanks [@kingston](https://github.com/kingston)! - Upgrade vitest to 3.0.7 and vite to 6.2.0

## 0.10.2

### Patch Changes

- [#436](https://github.com/halfdomelabs/baseplate/pull/436) [`1bc1674`](https://github.com/halfdomelabs/baseplate/commit/1bc167442e649490b22d3afc6c508fcd23a194a4) Thanks [@kingston](https://github.com/kingston)! - Upgrade Vitest to 3.0.5 and Sentry to 8.55.0

- [#430](https://github.com/halfdomelabs/baseplate/pull/430) [`2e5e7b4`](https://github.com/halfdomelabs/baseplate/commit/2e5e7b4b9fd1308ee06e5c83ac54fef7926685ab) Thanks [@kingston](https://github.com/kingston)! - Upgrade Vitest to 3.0.3 and Vite to 6.0.11 (and associated dependencies)

## 0.10.1

### Patch Changes

- [#428](https://github.com/halfdomelabs/baseplate/pull/428) [`5507eb7`](https://github.com/halfdomelabs/baseplate/commit/5507eb77d5413d3b87fa50988a6e4a1d58d78a14) Thanks [@kingston](https://github.com/kingston)! - Refactor output file writing and support file IDs to allow rename operations

- Updated dependencies [[`5507eb7`](https://github.com/halfdomelabs/baseplate/commit/5507eb77d5413d3b87fa50988a6e4a1d58d78a14), [`5507eb7`](https://github.com/halfdomelabs/baseplate/commit/5507eb77d5413d3b87fa50988a6e4a1d58d78a14)]:
  - @halfdomelabs/sync@0.9.0
  - @halfdomelabs/utils@0.1.2

## 0.10.0

### Minor Changes

- [#420](https://github.com/halfdomelabs/baseplate/pull/420) [`f0ee4e0`](https://github.com/halfdomelabs/baseplate/commit/f0ee4e07fc9d40947f319efb788f7fb596848231) Thanks [@kingston](https://github.com/kingston)! - Refactor generators to pass instantiated generator directly to engine instead of intermediate JSON. Note: This means deleting any descriptor JSON files from the baseplate folder for each app as they are no longer used.

### Patch Changes

- [#418](https://github.com/halfdomelabs/baseplate/pull/418) [`71e3257`](https://github.com/halfdomelabs/baseplate/commit/71e325718e71aabffc02108ad6e97aa7f99729c9) Thanks [@kingston](https://github.com/kingston)! - Refactor sync package for better code organization

- [#402](https://github.com/halfdomelabs/baseplate/pull/402) [`48bda89`](https://github.com/halfdomelabs/baseplate/commit/48bda899b7b4158ba6ec58118edacc3b61ddb043) Thanks [@kingston](https://github.com/kingston)! - Support generation on Windows platforms

- [#404](https://github.com/halfdomelabs/baseplate/pull/404) [`70c6478`](https://github.com/halfdomelabs/baseplate/commit/70c6478dfe7a5cfe19200b838c97327cd2dc0757) Thanks [@kingston](https://github.com/kingston)! - Refactor Auth0 generators to use new more extensible auth pattern

- [#406](https://github.com/halfdomelabs/baseplate/pull/406) [`cd92861`](https://github.com/halfdomelabs/baseplate/commit/cd92861d764380264dcc7d480407edf618421e70) Thanks [@kingston](https://github.com/kingston)! - Upgrade prettier-plugin-packagejson to 2.5.6

- [#416](https://github.com/halfdomelabs/baseplate/pull/416) [`b18263c`](https://github.com/halfdomelabs/baseplate/commit/b18263c1a06a74c9c5456b1efb0d7171e3b747cc) Thanks [@kingston](https://github.com/kingston)! - Refactor generators to use createGeneratorsWithTasks instead of createGeneratorsWithChildren

- [#414](https://github.com/halfdomelabs/baseplate/pull/414) [`bc756fd`](https://github.com/halfdomelabs/baseplate/commit/bc756fd5ec6c27f0b4883ca778fbbf2bc63106ed) Thanks [@kingston](https://github.com/kingston)! - Introduce concept of scopes for provider dependency resolution to replace hoisting/peer/parent resolution

- [#407](https://github.com/halfdomelabs/baseplate/pull/407) [`09243e5`](https://github.com/halfdomelabs/baseplate/commit/09243e511eefa65ce0809ec8b9228a74f690cdf6) Thanks [@kingston](https://github.com/kingston)! - Upgrade PNPM to 9.15.1

- [#419](https://github.com/halfdomelabs/baseplate/pull/419) [`9f34f54`](https://github.com/halfdomelabs/baseplate/commit/9f34f54d6b6c9762f5237000c83aa9959116a282) Thanks [@kingston](https://github.com/kingston)! - Change monorepo tooling to Turborepo from NX for easier caching

- [#412](https://github.com/halfdomelabs/baseplate/pull/412) [`a09b91f`](https://github.com/halfdomelabs/baseplate/commit/a09b91f2d1ebd4c91653bdc2a89d03947d1b06da) Thanks [@kingston](https://github.com/kingston)! - refactor: Allow optional returns from run function in generator

- [#407](https://github.com/halfdomelabs/baseplate/pull/407) [`09243e5`](https://github.com/halfdomelabs/baseplate/commit/09243e511eefa65ce0809ec8b9228a74f690cdf6) Thanks [@kingston](https://github.com/kingston)! - Upgrade Node to 20.18.1

- [#424](https://github.com/halfdomelabs/baseplate/pull/424) [`6a317cc`](https://github.com/halfdomelabs/baseplate/commit/6a317cc437fd53c9488067811bade99b167072f5) Thanks [@kingston](https://github.com/kingston)! - Replace lodash/ramda with es-tookit

- Updated dependencies [[`71e3257`](https://github.com/halfdomelabs/baseplate/commit/71e325718e71aabffc02108ad6e97aa7f99729c9), [`48bda89`](https://github.com/halfdomelabs/baseplate/commit/48bda899b7b4158ba6ec58118edacc3b61ddb043), [`6a317cc`](https://github.com/halfdomelabs/baseplate/commit/6a317cc437fd53c9488067811bade99b167072f5), [`b18263c`](https://github.com/halfdomelabs/baseplate/commit/b18263c1a06a74c9c5456b1efb0d7171e3b747cc), [`17fc44f`](https://github.com/halfdomelabs/baseplate/commit/17fc44f3c2d232c9712ed43a27439594b41ea139), [`bc756fd`](https://github.com/halfdomelabs/baseplate/commit/bc756fd5ec6c27f0b4883ca778fbbf2bc63106ed), [`a09b91f`](https://github.com/halfdomelabs/baseplate/commit/a09b91f2d1ebd4c91653bdc2a89d03947d1b06da), [`9f34f54`](https://github.com/halfdomelabs/baseplate/commit/9f34f54d6b6c9762f5237000c83aa9959116a282), [`a09b91f`](https://github.com/halfdomelabs/baseplate/commit/a09b91f2d1ebd4c91653bdc2a89d03947d1b06da), [`62acb20`](https://github.com/halfdomelabs/baseplate/commit/62acb202ba44cf4bdbafdf5643d115c1811719ff), [`bc756fd`](https://github.com/halfdomelabs/baseplate/commit/bc756fd5ec6c27f0b4883ca778fbbf2bc63106ed), [`f0ee4e0`](https://github.com/halfdomelabs/baseplate/commit/f0ee4e07fc9d40947f319efb788f7fb596848231), [`e76c097`](https://github.com/halfdomelabs/baseplate/commit/e76c09721852d1a367ca4867f5e6abc350684b0c)]:
  - @halfdomelabs/sync@0.8.0
  - @halfdomelabs/utils@0.1.1

## 0.9.9

### Patch Changes

- 6ca94da: Upgrade Zod to 3.24.1
- 354f4c9: [internal] Refactor formatter provider to become part of generator output
- Updated dependencies [6ca94da]
- Updated dependencies [354f4c9]
  - @halfdomelabs/sync@0.7.12

## 0.9.8

### Patch Changes

- 77d9399: Upgrade ESLint to v9 and use updated Linter configurations
- Updated dependencies [77d9399]
  - @halfdomelabs/sync@0.7.11

## 0.9.7

### Patch Changes

- 416f0941: Switch to ESM module resolution for backend (before syncing, run `pnpx migrate-esm-imports src baseplate/.clean` on your backend folder to minimize merge errors)
- Updated dependencies [416f0941]
  - @halfdomelabs/sync@0.7.10

## 0.9.6

### Patch Changes

- 8cb0ef35: Upgrade prettier to 3.3.3 and associated plugins to latest
- 2373fec8: Upgrade PNPM to 9.10.0
- 92654962: Upgrade Typescript to 5.5.4 using PNPM catalog
- 92c1401f: Upgrade vitest to 2.1.1 and vite to 5.4.7 and @types/react to 18.3.8
- 8cb0ef35: Upgrade assorted dependencies
- Updated dependencies [92654962]
- Updated dependencies [92c1401f]
- Updated dependencies [8cb0ef35]
  - @halfdomelabs/sync@0.7.9

## 0.9.5

### Patch Changes

- 1835934: Update tsconfig to support Node 20 target/lib
- Updated dependencies [f44674a]
  - @halfdomelabs/sync@0.7.8

## 0.9.4

### Patch Changes

- 3dbb454: Allow vitest to pass even if there are no tests
- 3dbb454: Expose prisma field descriptor
- Updated dependencies [3dbb454]
  - @halfdomelabs/sync@0.7.7

## 0.9.3

### Patch Changes

- ddbbead: Upgrade vitest to 2.0.3
- Updated dependencies [ddbbead]
  - @halfdomelabs/sync@0.7.6

## 0.9.2

### Patch Changes

- 02a4d70: Upgrade Sentry to 8.19.0 (https://docs.sentry.io/platforms/javascript/migration/v7-to-v8/)

## 0.9.1

### Patch Changes

- d8374b4: Upgrade tsc-alias to 1.8.10
- Updated dependencies [d8374b4]
  - @halfdomelabs/sync@0.7.5

## 0.9.0

### Minor Changes

- 7e95126: Replace 'jest' with 'vitest'.

### Patch Changes

- e32a926: Upgrade Node to 20.15.1
- bcc68c0: Upgrade Pothos to v4
- 94feb66: Upgrade Typescript to 5.4.4
- c0b42fc: Upgrade eslint and plugins to latest v8 versions
- e32a926: Upgrade PNPM to 9.5.0
- a6f01ea: Set up new plugin architecture and migrate storage plugin to new plugin architecture
- Updated dependencies [94feb66]
- Updated dependencies [a6f01ea]
  - @halfdomelabs/sync@0.7.4

## 0.8.0

### Minor Changes

- 3f95dc6: Upgrade PNPM to 9.1.2

### Patch Changes

- 3b720a2: Enable ETA templating from Typescript code files
- 082dfc3: Upgrade Zod to 3.23.8
- 082dfc3: Lay groundwork for initial plugin system with plugin discovery [in development]
- eda7e94: Fix expression replacement to support web app without auth
- 3f95dc6: Upgrade prettier to 3.2.5
- Updated dependencies [082dfc3]
- Updated dependencies [082dfc3]
  - @halfdomelabs/sync@0.7.3

## 0.7.6

### Patch Changes

- 9f33a18: Switch Vite projects to use ESM instead of CJS
  - @halfdomelabs/sync@0.7.2

## 0.7.5

### Patch Changes

- 988235d: Add fix for prettier plugin loading to use import instead of require

## 0.7.4

### Patch Changes

- 922f0bf9: Upgrade prettier plugins and fix bug when prettier plugins were not present
- 42beb73c: Upgrade local Docker Postgres to 16.2 and Redis to 7.2.4. See [Docker upgrade documentation](https://docs.hdlabs.dev/docs/guides/manual-upgrade-postgres) for upgrade instructions
  - @halfdomelabs/sync@0.7.2

## 0.7.3

### Patch Changes

- f69fbf50: Upgrade vite to 5.2.4 and vitest to 1.4.0
- 4c4cf8e5: Fix prettier plugins not being activated
- 4c4cf8e5: Added sorting of package.json with prettier
- Updated dependencies [f69fbf50]
  - @halfdomelabs/sync@0.7.2

## 0.7.2

### Patch Changes

- Updated dependencies [114717fe]
  - @halfdomelabs/sync@0.7.1

## 0.7.1

### Patch Changes

- 3da6a70: Upgrade to Node 20 and Typescript 5.2.2, cleaning up tsconfig setup
- Updated dependencies [63794f7]
- Updated dependencies [3da6a70]
  - @halfdomelabs/sync@0.7.0

## 0.7.0

### Minor Changes

- c314b65: Upgrade PNPM to 8.10.5
- c314b65: Upgrade to Node 18.18.2
- c314b65: Upgrade dependencies across the board to latest
- f24754d: Updated eslint/prettier rules

### Patch Changes

- f24754d: Upgrade to Node 18.17.1
- 47d84ca: Upgrade jest, Sentry, Postmark, and Stripe integrations to latest
- Updated dependencies [f24754d]
- Updated dependencies [f24754d]
  - @halfdomelabs/sync@0.6.0

## 0.6.1

### Patch Changes

- c4c38ec: Upgraded dependencies and remove gulp
- Updated dependencies [c4c38ec]
  - @halfdomelabs/sync@0.5.1

## 0.6.0

### Minor Changes

- 08a2746: Switch generation from yarn v1 to pnpm for faster build times (run pnpm import - https://medium.com/frontendweb/how-to-manage-multiple-nodejs-versions-with-pnpm-8bcce90abedb)

### Patch Changes

- 66ff670: Add ts-node back into dependencies to make ts-jest work
- Updated dependencies [08a2746]
  - @halfdomelabs/sync@0.5.0

## 0.5.0

### Minor Changes

- 0027b3d: Upgrade generated dependencies to get latest and greatest

### Patch Changes

- Updated dependencies [0027b3d]
- Updated dependencies [ba3f678]
  - @halfdomelabs/sync@0.4.0

## 0.4.2

### Patch Changes

- Updated dependencies [ce57ca0]
  - @halfdomelabs/sync@0.3.3

## 0.4.1

### Patch Changes

- 3f45e59: Fix changeset release process to build app before releasing
- Updated dependencies [3f45e59]
  - @halfdomelabs/sync@0.3.2

## 0.4.0

### Minor Changes

- c6893a5: Upgrade to Node 18.16 from Node 16.10

### Patch Changes

- c6893a5: Add --non-interactive to yarn install to fix yarn installation failures
- Updated dependencies [c6893a5]
  - @halfdomelabs/sync@0.3.1

## 0.3.0

### Minor Changes

- dcd86ed: Switch all packages to ESM
- dcd86ed: Switch to local version of prettier if version matches speeding up generation times considerably
- f7cb616: Switch to pnpm for package management

### Patch Changes

- Updated dependencies [dcd86ed]
- Updated dependencies [f7cb616]
  - @halfdomelabs/sync@0.3.0

## 0.2.1

### Patch Changes

- ec0218a: Upgrade tsc-alias tooling
- Updated dependencies [ec0218a]
  - @halfdomelabs/sync@0.2.1

## 0.2.0

### Minor Changes

- 5f2d7d8: Prepare Baseplate packages for release

### Patch Changes

- Updated dependencies [5f2d7d8]
  - @halfdomelabs/sync@0.2.0
