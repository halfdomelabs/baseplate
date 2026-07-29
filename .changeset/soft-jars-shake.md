---
'@baseplate-dev/plugin-storage': patch
---

Orphaned files now get a 24 hour grace period before automatic cleanup deletes them, instead of becoming eligible immediately. This removes a foot-gun where confirming an upload without attaching it to its parent entity in the same transaction could result in the file being deleted within the hour. The grace period is measured from when the file record was last updated, so confirming an upload restarts the clock.
