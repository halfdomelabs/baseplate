---
'@baseplate-dev/project-builder-cli': patch
---

The release script now fails fast if a version bump would escalate the 0.x line to a 1.0 major, which can happen unintentionally when a minor changeset is applied to the fixed package group.
