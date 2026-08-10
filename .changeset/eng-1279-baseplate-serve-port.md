---
'@baseplate-dev/project-builder-cli': patch
'@baseplate-dev/project-builder-dev': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/utils': patch
---

`baseplate serve` now reads `.env.local` and `.env` from the current directory, so you can set the port per project with `BASEPLATE_PORT` or `PORT_OFFSET` without exporting shell variables. A plain `PORT` variable is no longer used for the serve port.
