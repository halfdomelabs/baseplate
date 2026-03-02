---
'@baseplate-dev/project-builder-dev': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-test': patch
---

Add test project infrastructure with `baseplate-dev test-project` and `baseplate-dev test` commands for managing snapshot-based test projects. Test projects store the project definition and per-app snapshot diffs in `test-projects/<name>/`, with generated output written to gitignored `generated-tests/<name>/`. Core logic implemented as service actions (`test-project-generate`, `test-project-save`, `test-project-init`) in project-builder-server, accessible via CLI, MCP, and TRPC.

CLI split into two command groups: `test-project` for lifecycle management (init, generate, save, run-env) and `test` for execution (gen, web). The `pnpm-lock.yaml` is stored in the test project directory and copied during generate/save for reproducible installs. Test definitions use `*.gen.ts` for generated code tests and `*.web.ts` for web UI tests.

Move snapshot storage from `<app>/.baseplate-snapshot/` to `<projectRoot>/baseplate/snapshots/<appName>/`, centralizing all project metadata under the `baseplate/` folder. Existing `.baseplate-snapshot/` directories should be manually moved to the new location.

Move E2E test runner infrastructure from project-builder-test into project-builder-dev as a new `e2e-runner` subpath export, enabling plugins to define and run their own E2E test cases. Simplify project-builder-test to a scripts-only container that invokes `baseplate-dev` commands.
