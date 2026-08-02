---
'@baseplate-dev/plugin-storage': patch
---

Storage cleanup no longer deletes database records for files whose storage deletion failed; failed deletions are logged and retried on the next run.
