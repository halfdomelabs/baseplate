---
'@baseplate-dev/project-builder-cli': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/sync': patch
---

Add force overwrite mode for sync command

Adds a `--force-overwrite` flag to the `baseplate sync` command that bypasses merge conflict detection and overwrites existing files with generated content without attempting to merge changes. When force overwrite is enabled, files matching patterns in `.baseplateignore` are automatically excluded from being overwritten to preserve user customizations.
