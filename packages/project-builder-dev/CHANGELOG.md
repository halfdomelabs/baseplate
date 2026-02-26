# @baseplate-dev/project-builder-dev

## 0.5.4

### Patch Changes

- [#782](https://github.com/halfdomelabs/baseplate/pull/782) [`a136dc9`](https://github.com/halfdomelabs/baseplate/commit/a136dc90ba12783e059fd3c8a067d1b5496ed3ce) Thanks [@kingston](https://github.com/kingston)! - Extract developer tooling into new `@baseplate-dev/project-builder-dev` package with `baseplate-dev` binary.
  - `project-builder-dev` includes: `templates`, `snapshot`, `dev-server`, `sync-examples` commands, plus full MCP server (all actions)
  - `project-builder-cli` retains end-user commands only: `sync`, `diff`, `serve`, `config`, `projects`, and a user-scoped MCP server (sync/diff actions only)
  - `project-builder-server` exports new `USER_SERVICE_ACTIONS` for the subset of actions exposed to end-users via MCP
  - Plugins auto-discovered from CWD's `package.json` — no `project-builder-common` dependency in `project-builder-dev`
  - `generateProject(dir)` exported from `project-builder-dev` for programmatic project generation in tests

- Updated dependencies [[`bd1095e`](https://github.com/halfdomelabs/baseplate/commit/bd1095e52dc3cecdb40bf84a906490a7c92fec40), [`a136dc9`](https://github.com/halfdomelabs/baseplate/commit/a136dc90ba12783e059fd3c8a067d1b5496ed3ce), [`3029d42`](https://github.com/halfdomelabs/baseplate/commit/3029d42f5d5967721f2b0d5892ea07a80c5f3a1f), [`a616ae7`](https://github.com/halfdomelabs/baseplate/commit/a616ae7609285e9aa446997fd342cdb5b303a45d), [`eadad84`](https://github.com/halfdomelabs/baseplate/commit/eadad8494128ded2cbc76dfbe3b97f93769ea41f), [`dc238be`](https://github.com/halfdomelabs/baseplate/commit/dc238be00158a528a60d9e6ef9cec32b2d8297be), [`bd25ff0`](https://github.com/halfdomelabs/baseplate/commit/bd25ff08e71faeb97b560e7b349dba1967155704), [`78315cc`](https://github.com/halfdomelabs/baseplate/commit/78315ccd9b0b0330cd2d08584c6d5ec516d641e3), [`bd25ff0`](https://github.com/halfdomelabs/baseplate/commit/bd25ff08e71faeb97b560e7b349dba1967155704)]:
  - @baseplate-dev/project-builder-lib@0.5.4
  - @baseplate-dev/project-builder-server@0.5.4
  - @baseplate-dev/project-builder-web@0.5.4
  - @baseplate-dev/utils@0.5.4
