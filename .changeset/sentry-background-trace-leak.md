---
'@baseplate-dev/plugin-observability': patch
---

Fix a backend memory leak that occurred when Sentry tracing and background workers (pg-boss or BullMQ) were both enabled.
