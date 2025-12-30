# @baseplate-dev/plugin-queue

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
