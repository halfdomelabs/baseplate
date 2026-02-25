---
'@baseplate-dev/project-builder-cli': patch
'@baseplate-dev/project-builder-dev': patch
'@baseplate-dev/project-builder-server': patch
---

Extract developer tooling into new `@baseplate-dev/project-builder-dev` package with `baseplate-dev` binary.

- `project-builder-dev` includes: `templates`, `snapshot`, `dev-server`, `sync-examples` commands, plus full MCP server (all actions)
- `project-builder-cli` retains end-user commands only: `sync`, `diff`, `serve`, `config`, `projects`, and a user-scoped MCP server (sync/diff actions only)
- `project-builder-server` exports new `USER_SERVICE_ACTIONS` for the subset of actions exposed to end-users via MCP
- Plugins auto-discovered from CWD's `package.json` — no `project-builder-common` dependency in `project-builder-dev`
- `generateProject(dir)` exported from `project-builder-dev` for programmatic project generation in tests
