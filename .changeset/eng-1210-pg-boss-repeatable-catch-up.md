---
'@baseplate-dev/plugin-queue': patch
---

Fixed repeatable pg-boss jobs (e.g. scheduled cleanup jobs) being able to pile up and run back-to-back after a worker process was offline for a while, by giving repeatable-job queues pg-boss's exclusive policy so at most one pending instance can exist at a time.
