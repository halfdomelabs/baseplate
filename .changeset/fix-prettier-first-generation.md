---
'@baseplate-dev/sync': patch
'@baseplate-dev/core-generators': patch
---

Fix Prettier formatting issues on first code generation by adding a post-write command that re-formats files after dependencies are installed
