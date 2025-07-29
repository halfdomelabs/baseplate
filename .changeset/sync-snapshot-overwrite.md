---
'@baseplate-dev/project-builder-server': patch
---

Implement snapshot application in sync command when overwrite mode is enabled. When `baseplate sync --overwrite` is used with snapshots, the sync process now applies snapshot diffs to the generated output before writing files to the filesystem, matching the behavior described in the design doc.
