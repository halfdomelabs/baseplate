---
'@baseplate-dev/plugin-storage': patch
---

Storage cleanup now processes the oldest eligible files first and no longer deletes database records for files whose storage deletion failed, so files age out predictably and failed deletions are retried on the next run.
