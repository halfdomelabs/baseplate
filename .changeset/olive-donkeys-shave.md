---
'@baseplate-dev/plugin-queue': patch
---

Upgrade pg-boss to v12 and enable LISTEN/NOTIFY so queue workers pick up newly enqueued jobs the moment they are written instead of waiting for the next poll, and add a new `enqueueBulk` method to the queue service for enqueueing many jobs in a single round trip on both the pg-boss and BullMQ backends. Queue handlers now run up to 10 jobs concurrently per worker process on both backends, where they previously ran one at a time; set `concurrency` on a queue's binding options to change this, or to 1 for handlers that are not safe to run against themselves. Generated apps run pg-boss's schema migration automatically on first start after this upgrade.
