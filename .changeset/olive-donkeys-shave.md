---
'@baseplate-dev/plugin-queue': patch
---

Upgrade pg-boss to v12 and enable LISTEN/NOTIFY so queue workers pick up newly enqueued jobs the moment they are written instead of waiting for the next poll, and add a new `enqueueBulk` method to the queue service for enqueueing many jobs in a single round trip on both the pg-boss and BullMQ backends. pg-boss workers now also fetch jobs in batches of up to 10, so handlers on a backlogged queue can run concurrently where they previously ran one at a time. Generated apps run pg-boss's schema migration automatically on first start after this upgrade.
