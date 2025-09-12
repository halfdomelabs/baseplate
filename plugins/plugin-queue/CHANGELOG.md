# @baseplate-dev/plugin-queue

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
