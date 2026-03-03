---
'@baseplate-dev/project-builder-dev': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-test': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-cli': patch
'@baseplate-dev/create-project': patch
---

Unify test and example project discovery under a single system:

- Replace `isInternalExample: boolean` on `ProjectInfo` with `type: 'user' | 'example' | 'test'` and add required `baseplateDirectory` field.
- Test projects now live in `tests/<name>/` with output generated to `tests/<name>/.output/` (gitignored).
- Test projects are auto-discovered alongside example projects with `test:` name prefix (e.g. `test:simple`).
- Remove dedicated `test-project generate` and `test-project save` CLI commands — use unified `sync` and `snapshot save` commands instead.
- Remove `testProjectGenerateAction` and `testProjectSaveAction` server actions (duplicated `syncProject`/`createSnapshotForProject` logic).
- Plumb `baseplateDirectory` from `ProjectInfo` through all sync and snapshot actions for consistent resolution.
- Add `baseplate.config.json` for deterministic project discovery — replaces directory-walking heuristics.
- Remove `EXCLUDE_EXAMPLES` and `PLUGIN_ROOT_DIRECTORIES` env vars — now configured in `baseplate.config.json`.
- Unify `discoverProjects` to accept structured `DiscoverProjectsOptions` with `projectDirectories`, `exampleDirectories`, and `testDirectories` — replaces flat directory list + `isExampleProject` heuristic.
- Remove `isExampleProject` — callers now explicitly pass project type via structured options.
- Remove `discoverTestProjects` from `project-builder-dev` — absorbed into unified `discoverProjects`.
- Remove duplicate `project-resolver.ts` from `project-builder-cli` — use shared `list-projects.ts` instead.
