---
'@baseplate-dev/plugin-queue': patch
---

Queues can now deduplicate jobs by key, making enqueueing idempotent when a caller may retry. Set `deduplication: true` in a queue definition's options and pass a `singletonKey` when enqueueing: while a job with that key is pending or active, further enqueues with the same key are dropped instead of creating a duplicate job. The key is released once the job completes or fails, so a later enqueue with the same key creates a new job.
