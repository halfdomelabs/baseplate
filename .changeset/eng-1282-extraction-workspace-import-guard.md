---
'@baseplate-dev/sync': patch
'@baseplate-dev/core-generators': patch
'@baseplate-dev/project-builder-server': patch
---

Template extraction now rejects a raw template that hardcodes a literal import from any workspace package in the source project, not just the app being extracted, so a copy-pasted import from another example's package can no longer slip into a shared generator unnoticed.
