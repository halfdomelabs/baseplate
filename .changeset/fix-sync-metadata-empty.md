---
'@baseplate-dev/project-builder-server': patch
---

Fix sync metadata file occasionally becoming empty by using unique temp file names to prevent collisions during concurrent writes
