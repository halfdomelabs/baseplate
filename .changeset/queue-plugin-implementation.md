---
'@baseplate-dev/plugin-queue': patch
'@baseplate-dev/core-generators': patch
'@baseplate-dev/react-generators': patch
'@baseplate-dev/fastify-generators': patch
---

Add queue plugin with pg-boss implementation

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
