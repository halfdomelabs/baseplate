# @baseplate-dev/plugin-queue

## 2.0.4

### Patch Changes

- Updated dependencies [[`bd1095e`](https://github.com/halfdomelabs/baseplate/commit/bd1095e52dc3cecdb40bf84a906490a7c92fec40), [`1225fda`](https://github.com/halfdomelabs/baseplate/commit/1225fdace3e8da20152e0e78c4decf0c063faa56), [`3029d42`](https://github.com/halfdomelabs/baseplate/commit/3029d42f5d5967721f2b0d5892ea07a80c5f3a1f), [`d6be7a9`](https://github.com/halfdomelabs/baseplate/commit/d6be7a97b5e6970be674bf9b49eddf1499b51f04), [`eadad84`](https://github.com/halfdomelabs/baseplate/commit/eadad8494128ded2cbc76dfbe3b97f93769ea41f), [`dc238be`](https://github.com/halfdomelabs/baseplate/commit/dc238be00158a528a60d9e6ef9cec32b2d8297be), [`bd25ff0`](https://github.com/halfdomelabs/baseplate/commit/bd25ff08e71faeb97b560e7b349dba1967155704), [`78315cc`](https://github.com/halfdomelabs/baseplate/commit/78315ccd9b0b0330cd2d08584c6d5ec516d641e3), [`2104145`](https://github.com/halfdomelabs/baseplate/commit/210414588d8b1f6816c45054be3b7eea5763b5ce), [`bd25ff0`](https://github.com/halfdomelabs/baseplate/commit/bd25ff08e71faeb97b560e7b349dba1967155704)]:
  - @baseplate-dev/project-builder-lib@0.5.4
  - @baseplate-dev/fastify-generators@0.5.4
  - @baseplate-dev/core-generators@0.5.4
  - @baseplate-dev/sync@0.5.4
  - @baseplate-dev/ui-components@0.5.4
  - @baseplate-dev/utils@0.5.4

## 2.0.3

### Patch Changes

- Updated dependencies [[`cb2446e`](https://github.com/halfdomelabs/baseplate/commit/cb2446e235794bf5d45a1671ae320ccce12eb504), [`6c190fe`](https://github.com/halfdomelabs/baseplate/commit/6c190fe50240f0ddc984af757b7900d053433bb1), [`254d675`](https://github.com/halfdomelabs/baseplate/commit/254d675079930e5b569bf1c0c4576f1459d23a03), [`9129381`](https://github.com/halfdomelabs/baseplate/commit/9129381e17504136837d07deb9958708791da43e)]:
  - @baseplate-dev/core-generators@0.5.3
  - @baseplate-dev/fastify-generators@0.5.3
  - @baseplate-dev/project-builder-lib@0.5.3
  - @baseplate-dev/sync@0.5.3
  - @baseplate-dev/ui-components@0.5.3
  - @baseplate-dev/utils@0.5.3

## 2.0.2

### Patch Changes

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

- Updated dependencies [[`ef1354d`](https://github.com/halfdomelabs/baseplate/commit/ef1354da11e2c48a80af03f44834555ce63a2948), [`b4db947`](https://github.com/halfdomelabs/baseplate/commit/b4db947f256c4b8639d7f18ffb58bb2b1646c497), [`683eb15`](https://github.com/halfdomelabs/baseplate/commit/683eb15c2c37259266959e0760b419e07f70a27e), [`938a7b1`](https://github.com/halfdomelabs/baseplate/commit/938a7b113550a7a245b65b5dfe3cc641f11096b7), [`02740a6`](https://github.com/halfdomelabs/baseplate/commit/02740a6e230c7fbf28fc768543353e847671c51b), [`dd40bcd`](https://github.com/halfdomelabs/baseplate/commit/dd40bcd219c79f0cd7b66c0427c77deda0664072), [`7d1a9d6`](https://github.com/halfdomelabs/baseplate/commit/7d1a9d6d381279434f2ac632e9f8accde34dda25), [`63bd074`](https://github.com/halfdomelabs/baseplate/commit/63bd074b3b24b0978d4271a5bc76a8531b0f60c2)]:
  - @baseplate-dev/fastify-generators@0.5.2
  - @baseplate-dev/project-builder-lib@0.5.2
  - @baseplate-dev/core-generators@0.5.2
  - @baseplate-dev/ui-components@0.5.2
  - @baseplate-dev/sync@0.5.2
  - @baseplate-dev/utils@0.5.2

## 2.0.1

### Patch Changes

- [#737](https://github.com/halfdomelabs/baseplate/pull/737) [`55aa484`](https://github.com/halfdomelabs/baseplate/commit/55aa484621f2dc5b1195b6b537e7d6ad215bc499) Thanks [@kingston](https://github.com/kingston)! - Refactor plugin spec system with lazy initialization and clear setup/use phases

  This refactoring overhauls the plugin spec system to introduce a two-phase architecture with lazy initialization:

  **New Architecture:**
  - **Setup phase (init)**: Plugins register their implementations during module initialization using mutable field containers
  - **Use phase**: Consumers access registered items through a read-only interface, with lazy initialization on first access
  - **FieldMap-based specs**: New `createFieldMapSpec` helper provides type-safe containers (maps, arrays, named arrays, scalars) with automatic source tracking

  **Key changes:**
  - Rename `PluginImplementationStore` to `PluginSpecStore` with cached `use()` instances
  - Rename `createPlatformPluginExport` to `createPluginModule`
  - Add required `name` field to all plugin modules for unique identification
  - Convert all specs to use `createFieldMapSpec` with typed containers
  - Update all plugin modules to use new registration methods (`.add()`, `.set()`, `.push()`)
  - Introduce `ModuleContext` with `moduleKey` and `pluginKey` for better source tracking
  - Specs now define both `init` (mutable setup interface) and `use` (read-only consumption interface)

- Updated dependencies [[`2de5d5c`](https://github.com/halfdomelabs/baseplate/commit/2de5d5c43c5354571d50707a99b4028ff8792534), [`ecebd3b`](https://github.com/halfdomelabs/baseplate/commit/ecebd3bf50cfa2d2a62501e0be39c411b42bed25), [`ff4203e`](https://github.com/halfdomelabs/baseplate/commit/ff4203e45a057b25a0ded5ecb3e1c07f5c7108b4), [`55aa484`](https://github.com/halfdomelabs/baseplate/commit/55aa484621f2dc5b1195b6b537e7d6ad215bc499), [`2de5d5c`](https://github.com/halfdomelabs/baseplate/commit/2de5d5c43c5354571d50707a99b4028ff8792534)]:
  - @baseplate-dev/fastify-generators@0.5.1
  - @baseplate-dev/project-builder-lib@0.5.1
  - @baseplate-dev/core-generators@0.5.1
  - @baseplate-dev/sync@0.5.1
  - @baseplate-dev/ui-components@0.5.1
  - @baseplate-dev/utils@0.5.1

## 2.0.0

### Patch Changes

- Updated dependencies [[`fbabdec`](https://github.com/halfdomelabs/baseplate/commit/fbabdecf6715c21799d1c224b3a2162ef1f49797), [`9b31726`](https://github.com/halfdomelabs/baseplate/commit/9b31726ee0dce77dc7b16fa334eb597d86349599), [`97bd14e`](https://github.com/halfdomelabs/baseplate/commit/97bd14e381206b54e55c22264d1d406e83146146), [`d09175d`](https://github.com/halfdomelabs/baseplate/commit/d09175dc41d33fb0a818d53c2e2da899430a48cd), [`c7d373e`](https://github.com/halfdomelabs/baseplate/commit/c7d373ebaaeda2522515fdaeae0d37d0cd9ce7fe), [`2d5abd5`](https://github.com/halfdomelabs/baseplate/commit/2d5abd53fccfc2b15f8142fc796c5e4ea4c2f92a), [`8bfc742`](https://github.com/halfdomelabs/baseplate/commit/8bfc742b8a93393a5539babfd11b97a88ee9c39e)]:
  - @baseplate-dev/fastify-generators@0.5.0
  - @baseplate-dev/core-generators@0.5.0
  - @baseplate-dev/project-builder-lib@0.5.0
  - @baseplate-dev/sync@0.5.0
  - @baseplate-dev/ui-components@0.5.0

## 1.0.4

### Patch Changes

- Updated dependencies [[`ec2f1e9`](https://github.com/halfdomelabs/baseplate/commit/ec2f1e9716e84cd4a901c071eacf4971436962d9)]:
  - @baseplate-dev/fastify-generators@0.4.4
  - @baseplate-dev/core-generators@0.4.4
  - @baseplate-dev/project-builder-lib@0.4.4
  - @baseplate-dev/sync@0.4.4
  - @baseplate-dev/ui-components@0.4.4

## 1.0.3

### Patch Changes

- Updated dependencies [[`12d1e62`](https://github.com/halfdomelabs/baseplate/commit/12d1e625bc04256eeb2704faa3f36dfda00545f9), [`6e23a6f`](https://github.com/halfdomelabs/baseplate/commit/6e23a6f2ff99954eebcb78b450d0c18618aa0b54), [`f1bab33`](https://github.com/halfdomelabs/baseplate/commit/f1bab3310fa8c00c645a6d9aca0a6a757cb661f1), [`83e4e7f`](https://github.com/halfdomelabs/baseplate/commit/83e4e7f60adf67480cebb4ff419c015ff282010d), [`8622c4e`](https://github.com/halfdomelabs/baseplate/commit/8622c4e2b91788ad4a368c9f06f82a17ee1a29ed)]:
  - @baseplate-dev/fastify-generators@0.4.3
  - @baseplate-dev/core-generators@0.4.3
  - @baseplate-dev/project-builder-lib@0.4.3
  - @baseplate-dev/sync@0.4.3
  - @baseplate-dev/ui-components@0.4.3

## 1.0.2

### Patch Changes

- [#711](https://github.com/halfdomelabs/baseplate/pull/711) [`bde61e3`](https://github.com/halfdomelabs/baseplate/commit/bde61e3e5dfc4d6d19c0d2a71491de4605cd2c20) Thanks [@kingston](https://github.com/kingston)! - Add BullMQ plugin as managed child of queue plugin
  - Create new BullMQ plugin (`@baseplate-dev/plugin-queue/bullmq`) following the pg-boss plugin pattern
  - Add migration (021) to migrate `enableBullQueue` from backend app config to queue/bullmq plugin config
  - Remove old `bullMqGenerator` and `fastifyBullBoardGenerator` from fastify-generators
  - Remove Bull Board integration (to be replaced with local alternative in the future)
  - Remove `enableBullQueue` option from backend app schema and UI

- [#697](https://github.com/halfdomelabs/baseplate/pull/697) [`11fa86f`](https://github.com/halfdomelabs/baseplate/commit/11fa86fb8e7a209175f132b1b3d59cd24cf13d54) Thanks [@kingston](https://github.com/kingston)! - Ignore \*.map files from built output in package.json

- Updated dependencies [[`bde61e3`](https://github.com/halfdomelabs/baseplate/commit/bde61e3e5dfc4d6d19c0d2a71491de4605cd2c20), [`e8576b9`](https://github.com/halfdomelabs/baseplate/commit/e8576b9ba5912acf9d81bcc1b18a0fbc8df91220), [`795ee4c`](https://github.com/halfdomelabs/baseplate/commit/795ee4c18e7b393fb9247ced23a12de5e219ab15), [`6828918`](https://github.com/halfdomelabs/baseplate/commit/6828918121bb244fdc84758d28a87370cbc70992), [`e8576b9`](https://github.com/halfdomelabs/baseplate/commit/e8576b9ba5912acf9d81bcc1b18a0fbc8df91220), [`5d4ae05`](https://github.com/halfdomelabs/baseplate/commit/5d4ae05b1781100ee21c5a60784f0107014bade4), [`11fa86f`](https://github.com/halfdomelabs/baseplate/commit/11fa86fb8e7a209175f132b1b3d59cd24cf13d54), [`74529e7`](https://github.com/halfdomelabs/baseplate/commit/74529e7fffae8a70f8cfe801a1897204d010e291), [`4be6c7d`](https://github.com/halfdomelabs/baseplate/commit/4be6c7dc7d900c37585b93cf5bb7198de6a41f1f), [`2395821`](https://github.com/halfdomelabs/baseplate/commit/239582148fe92d80457a31021036fa1e2c51cf5d), [`18c7cf1`](https://github.com/halfdomelabs/baseplate/commit/18c7cf19c0d171b734eb9bcc53320ccf02baa08a), [`a173074`](https://github.com/halfdomelabs/baseplate/commit/a1730748bbbc21ea22d9d91bf28e34d2c351425b), [`e426b52`](https://github.com/halfdomelabs/baseplate/commit/e426b52d37f04f71ca960eb4cad2246af0603bd3)]:
  - @baseplate-dev/project-builder-lib@0.4.2
  - @baseplate-dev/fastify-generators@0.4.2
  - @baseplate-dev/sync@0.4.2
  - @baseplate-dev/core-generators@0.4.2
  - @baseplate-dev/ui-components@0.4.2

## 1.0.1

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.4.1
  - @baseplate-dev/fastify-generators@0.4.1
  - @baseplate-dev/project-builder-lib@0.4.1
  - @baseplate-dev/sync@0.4.1
  - @baseplate-dev/ui-components@0.4.1

## 1.0.0

### Patch Changes

- [#691](https://github.com/halfdomelabs/baseplate/pull/691) [`d67b5bc`](https://github.com/halfdomelabs/baseplate/commit/d67b5bcd818c2b4e694ea132311964094ec3c546) Thanks [@kingston](https://github.com/kingston)! - Upgrade pg-boss to 11.1.1

- Updated dependencies [[`9f22eef`](https://github.com/halfdomelabs/baseplate/commit/9f22eef139c8db2dde679f6424eb23e024e37d19), [`c3c2a00`](https://github.com/halfdomelabs/baseplate/commit/c3c2a001d57a21f76e064af55941a43bedf26f18), [`839cbdf`](https://github.com/halfdomelabs/baseplate/commit/839cbdfc6ddc059aa86d24bf6ec5d8e95cce9042), [`c3c2a00`](https://github.com/halfdomelabs/baseplate/commit/c3c2a001d57a21f76e064af55941a43bedf26f18), [`e79df28`](https://github.com/halfdomelabs/baseplate/commit/e79df28eb7ab0275da2f630edcb1243bee40b7a5), [`e68624e`](https://github.com/halfdomelabs/baseplate/commit/e68624e9372480da767d220cae60d45d9ed3c636), [`6daff18`](https://github.com/halfdomelabs/baseplate/commit/6daff18a033d2d78746984edebba4d8c6fe957a5), [`ac912b3`](https://github.com/halfdomelabs/baseplate/commit/ac912b384559f48c3603976d070eb54c9f20fb9b), [`839cbdf`](https://github.com/halfdomelabs/baseplate/commit/839cbdfc6ddc059aa86d24bf6ec5d8e95cce9042), [`839cbdf`](https://github.com/halfdomelabs/baseplate/commit/839cbdfc6ddc059aa86d24bf6ec5d8e95cce9042), [`852c3a5`](https://github.com/halfdomelabs/baseplate/commit/852c3a5ff3a185e60efaeb2cbb90eed59a95ec2b), [`c3c2a00`](https://github.com/halfdomelabs/baseplate/commit/c3c2a001d57a21f76e064af55941a43bedf26f18), [`6daff18`](https://github.com/halfdomelabs/baseplate/commit/6daff18a033d2d78746984edebba4d8c6fe957a5), [`ac912b3`](https://github.com/halfdomelabs/baseplate/commit/ac912b384559f48c3603976d070eb54c9f20fb9b), [`e79df28`](https://github.com/halfdomelabs/baseplate/commit/e79df28eb7ab0275da2f630edcb1243bee40b7a5), [`ac912b3`](https://github.com/halfdomelabs/baseplate/commit/ac912b384559f48c3603976d070eb54c9f20fb9b), [`d324059`](https://github.com/halfdomelabs/baseplate/commit/d3240594e1c2bc2348eb1a7e8938f97ea5f55d22), [`57e15c0`](https://github.com/halfdomelabs/baseplate/commit/57e15c085099508898756385661df9cf54108466)]:
  - @baseplate-dev/project-builder-lib@0.4.0
  - @baseplate-dev/fastify-generators@0.4.0
  - @baseplate-dev/sync@0.4.0
  - @baseplate-dev/core-generators@0.4.0
  - @baseplate-dev/ui-components@0.4.0

## 0.1.8

### Patch Changes

- Updated dependencies [[`fc93dd7`](https://github.com/halfdomelabs/baseplate/commit/fc93dd70c182ac99d1f025745d88a32d6de733f5)]:
  - @baseplate-dev/fastify-generators@0.3.8
  - @baseplate-dev/core-generators@0.3.8
  - @baseplate-dev/project-builder-lib@0.3.8
  - @baseplate-dev/sync@0.3.8
  - @baseplate-dev/ui-components@0.3.8

## 0.1.7

### Patch Changes

- Updated dependencies [[`9508a8e`](https://github.com/halfdomelabs/baseplate/commit/9508a8ee75e33ea0c0632f3f5ef5621b020f530d), [`d6f70e0`](https://github.com/halfdomelabs/baseplate/commit/d6f70e03f539bd8687d9e9abfc0e7cef5c9e6e29)]:
  - @baseplate-dev/core-generators@0.3.7
  - @baseplate-dev/fastify-generators@0.3.7
  - @baseplate-dev/project-builder-lib@0.3.7
  - @baseplate-dev/sync@0.3.7
  - @baseplate-dev/ui-components@0.3.7

## 0.1.6

### Patch Changes

- Updated dependencies [[`1186a21`](https://github.com/halfdomelabs/baseplate/commit/1186a21df267d112a84a42ff1d3c87b495452ce0)]:
  - @baseplate-dev/core-generators@0.3.6
  - @baseplate-dev/fastify-generators@0.3.6
  - @baseplate-dev/project-builder-lib@0.3.6
  - @baseplate-dev/sync@0.3.6
  - @baseplate-dev/ui-components@0.3.6

## 0.1.5

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.3.5
  - @baseplate-dev/fastify-generators@0.3.5
  - @baseplate-dev/project-builder-lib@0.3.5
  - @baseplate-dev/sync@0.3.5
  - @baseplate-dev/ui-components@0.3.5

## 0.1.4

### Patch Changes

- [#647](https://github.com/halfdomelabs/baseplate/pull/647) [`18bea49`](https://github.com/halfdomelabs/baseplate/commit/18bea49f918d5c22aeea5c2e2dd7dab2e7d1b6fc) Thanks [@kingston](https://github.com/kingston)! - Small tweaks to fix pg boss impelementation

- [#643](https://github.com/halfdomelabs/baseplate/pull/643) [`7d9e6d0`](https://github.com/halfdomelabs/baseplate/commit/7d9e6d01e0a9920cee4c4d499beeffc1c663494a) Thanks [@kingston](https://github.com/kingston)! - Upgrade to TypeScript 5.8 with erasable syntax only mode

  This upgrade modernizes the codebase with TypeScript 5.8, enables erasable syntax only mode for better performance, and updates runtime dependencies.

  **Key Changes:**
  - Upgraded TypeScript to version 5.8
  - Enabled `erasableSyntaxOnly` compiler option for improved build performance
  - Updated Node.js requirement to 22.18
  - Updated PNPM requirement to 10.15
  - Fixed parameter property syntax to be compatible with erasable syntax only mode

- Updated dependencies [[`67dba69`](https://github.com/halfdomelabs/baseplate/commit/67dba697439e6bc76b81522c133d920af4dbdbb1), [`217de38`](https://github.com/halfdomelabs/baseplate/commit/217de385f3ac869c5ef740af32634db9bcab6b0c), [`67dba69`](https://github.com/halfdomelabs/baseplate/commit/67dba697439e6bc76b81522c133d920af4dbdbb1), [`f450b7f`](https://github.com/halfdomelabs/baseplate/commit/f450b7f75cf5ad71c2bdb1c077526251aa240dd0), [`7d9e6d0`](https://github.com/halfdomelabs/baseplate/commit/7d9e6d01e0a9920cee4c4d499beeffc1c663494a)]:
  - @baseplate-dev/sync@0.3.4
  - @baseplate-dev/fastify-generators@0.3.4
  - @baseplate-dev/project-builder-lib@0.3.4
  - @baseplate-dev/core-generators@0.3.4
  - @baseplate-dev/ui-components@0.3.4

## 0.1.3

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.3.3
  - @baseplate-dev/fastify-generators@0.3.3
  - @baseplate-dev/project-builder-lib@0.3.3
  - @baseplate-dev/sync@0.3.3
  - @baseplate-dev/ui-components@0.3.3

## 0.1.2

### Patch Changes

- Updated dependencies [[`cca138a`](https://github.com/halfdomelabs/baseplate/commit/cca138a84abbb901ab628bf571ae29211a180dbb), [`b4c15b9`](https://github.com/halfdomelabs/baseplate/commit/b4c15b98a518c53828f81624764ba693def85faf), [`04a4978`](https://github.com/halfdomelabs/baseplate/commit/04a49785642685ca4b56aec27dc0a18520674ef9), [`cca138a`](https://github.com/halfdomelabs/baseplate/commit/cca138a84abbb901ab628bf571ae29211a180dbb)]:
  - @baseplate-dev/project-builder-lib@0.3.2
  - @baseplate-dev/core-generators@0.3.2
  - @baseplate-dev/fastify-generators@0.3.2
  - @baseplate-dev/sync@0.3.2
  - @baseplate-dev/ui-components@0.3.2

## 0.1.1

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

- Updated dependencies [[`d79b0cf`](https://github.com/halfdomelabs/baseplate/commit/d79b0cfb9061dbeccc976a2f018b264849bef788), [`d79b0cf`](https://github.com/halfdomelabs/baseplate/commit/d79b0cfb9061dbeccc976a2f018b264849bef788)]:
  - @baseplate-dev/core-generators@0.3.1
  - @baseplate-dev/fastify-generators@0.3.1
  - @baseplate-dev/project-builder-lib@0.3.1
  - @baseplate-dev/sync@0.3.1
  - @baseplate-dev/ui-components@0.3.1
