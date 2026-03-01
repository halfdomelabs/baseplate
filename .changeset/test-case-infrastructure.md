---
'@baseplate-dev/project-builder-dev': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-test': patch
---

Add test case infrastructure with `baseplate-dev test` commands for managing snapshot-based test cases. Test cases now store only the project definition and per-app snapshot diffs in `tests/<name>/`, with generated output written to gitignored `generated-tests/<name>/`. Core logic implemented as service actions (`test-case-generate`, `test-case-save`, `test-case-init`) in project-builder-server, accessible via CLI, MCP, and TRPC. Migrates `tests/simple/` to the new format.

Move snapshot storage from `<app>/.baseplate-snapshot/` to `<projectRoot>/baseplate/snapshots/<appName>/`, centralizing all project metadata under the `baseplate/` folder. Existing `.baseplate-snapshot/` directories should be manually moved to the new location.
