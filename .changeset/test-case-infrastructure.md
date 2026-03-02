---
'@baseplate-dev/project-builder-dev': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-test': patch
---

Introduce centralized snapshot-based test project infrastructure with new CLI commands and improved storage structure:

- Adds `baseplate-dev test-project` and `baseplate-dev test` CLI commands to manage and execute snapshot-based test projects.
- Test projects live in `test-projects/<name>/`, storing the project definition and app-level snapshot diffs; generated output is written to gitignored `generated-tests/<name>/`.
- CLI split into two command groups:
  - `test-project` for lifecycle operations (init, generate, save, run-env)
  - `test` for actual execution (gen, web)
