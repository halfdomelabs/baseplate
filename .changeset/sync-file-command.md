---
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-cli': patch
---

Add `sync-file` command for incrementally applying generated files

- New CLI command: `pnpm baseplate sync-file <project> <app> <files...>`
- New MCP action: `sync-file` for programmatic access
- Allows applying specific generated files without performing a full sync
- Writes matching files to both working directory and generated folder
- Useful for incrementally fixing generators one file at a time
