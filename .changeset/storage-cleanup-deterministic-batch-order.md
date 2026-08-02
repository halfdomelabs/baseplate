---
'@baseplate-dev/plugin-storage': patch
---

Storage cleanup now processes the oldest eligible files first, so files age out predictably when the backlog exceeds the per-run batch limit.
