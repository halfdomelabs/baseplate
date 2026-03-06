---
'@baseplate-dev/project-builder-dev': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-test': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-cli': patch
'@baseplate-dev/create-project': patch
---

Unify test and example project discovery under a single system:

- Add `type: 'user' | 'example' | 'test'` and `baseplateDirectory` to `ProjectInfo`, replacing `isInternalExample`.
- Add `baseplate.config.json` for deterministic project discovery — replaces `isExampleProject` heuristic and `EXCLUDE_EXAMPLES`/`PLUGIN_ROOT_DIRECTORIES` env vars.
- Unify `discoverProjects` to accept structured options by project type — removes `discoverTestProjects` and duplicate `project-resolver.ts`.
- Test projects live in `tests/<name>/` with output to `.output/` (gitignored).
- Replace `test-project` subcommands with `baseplate-dev init <name> --type example|test` and `baseplate-dev run-env <test-name>`.
