---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/create-project': patch
---

Fixes for MCP staging: always default `enums` to `[]` to prevent runtime errors and make corrupt drafts recoverable.
