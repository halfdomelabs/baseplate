---
'@baseplate-dev/sync': patch
'@baseplate-dev/project-builder-server': patch
---

Cancelling a sync now stops at the next generator task or file instead of running the current app to completion, and a sync cancelled while post-write commands are running is reported as cancelled rather than as failed commands.
