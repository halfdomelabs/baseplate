---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/project-builder-cli': patch
---

Remove redundant `.optional()` wrapper from `withDefault`

`withDefault` previously wrapped the schema in both `.prefault()` and `.optional()`. Since `.prefault()` already makes fields accept absent/undefined input, the `.optional()` was redundant and caused the output type to incorrectly include `| undefined` for defaulted fields.
