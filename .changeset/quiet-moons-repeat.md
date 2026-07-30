---
'@baseplate-dev/project-builder-cli': patch
---

The default plugins package is now loaded on demand rather than when the CLI starts, so it is no longer pulled in by commands that never use it.
