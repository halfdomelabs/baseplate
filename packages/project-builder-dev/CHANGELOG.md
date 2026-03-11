# @baseplate-dev/project-builder-dev

## 0.6.1

### Patch Changes

- Updated dependencies [[`0b973f3`](https://github.com/halfdomelabs/baseplate/commit/0b973f3b9cb03fa1c49ceb49839b210466ecbbc7)]:
  - @baseplate-dev/project-builder-server@0.6.1
  - @baseplate-dev/project-builder-web@0.6.1
  - @baseplate-dev/project-builder-lib@0.6.1
  - @baseplate-dev/utils@0.6.1

## 0.6.0

### Patch Changes

- [#782](https://github.com/halfdomelabs/baseplate/pull/782) [`a136dc9`](https://github.com/halfdomelabs/baseplate/commit/a136dc90ba12783e059fd3c8a067d1b5496ed3ce) Thanks [@kingston](https://github.com/kingston)! - Extract developer tooling into new `@baseplate-dev/project-builder-dev` package with `baseplate-dev` binary.
  - `project-builder-dev` includes: `templates`, `snapshot`, `dev-server`, `sync-examples` commands, plus full MCP server (all actions)
  - `project-builder-cli` retains end-user commands only: `sync`, `diff`, `serve`, `config`, `projects`, and a user-scoped MCP server (sync/diff actions only)
  - `project-builder-server` exports new `USER_SERVICE_ACTIONS` for the subset of actions exposed to end-users via MCP
  - Plugins auto-discovered from CWD's `package.json` — no `project-builder-common` dependency in `project-builder-dev`
  - `generateProject(dir)` exported from `project-builder-dev` for programmatic project generation in tests

- [#802](https://github.com/halfdomelabs/baseplate/pull/802) [`801c706`](https://github.com/halfdomelabs/baseplate/commit/801c7066f7e943c026f03e71b8d39242036e0cad) Thanks [@kingston](https://github.com/kingston)! - Update prettier to ignore unchanged files in output

- [#798](https://github.com/halfdomelabs/baseplate/pull/798) [`ee7ee0e`](https://github.com/halfdomelabs/baseplate/commit/ee7ee0e552090612190eb4446a52c30f4eefce6a) Thanks [@kingston](https://github.com/kingston)! - Add MCP actions for reading and writing project definition entities, including draft session support for staging changes before committing.

- [#789](https://github.com/halfdomelabs/baseplate/pull/789) [`2f860c5`](https://github.com/halfdomelabs/baseplate/commit/2f860c513a1caf95fdfd0729cf548990166f9a6f) Thanks [@kingston](https://github.com/kingston)! - Unify test and example project discovery under a single system:
  - Add `type: 'user' | 'example' | 'test'` and `baseplateDirectory` to `ProjectInfo`, replacing `isInternalExample`.
  - Add `baseplate.config.json` for deterministic project discovery — replaces `isExampleProject` heuristic and `EXCLUDE_EXAMPLES`/`PLUGIN_ROOT_DIRECTORIES` env vars.
  - Unify `discoverProjects` to accept structured options by project type — removes `discoverTestProjects` and duplicate `project-resolver.ts`.
  - Test projects live in `tests/<name>/` with output to `.output/` (gitignored).
  - Replace `test-project` subcommands with `baseplate-dev init <name> --type example|test` and `baseplate-dev run-env <test-name>`.

- Updated dependencies [[`ee7ee0e`](https://github.com/halfdomelabs/baseplate/commit/ee7ee0e552090612190eb4446a52c30f4eefce6a), [`bd1095e`](https://github.com/halfdomelabs/baseplate/commit/bd1095e52dc3cecdb40bf84a906490a7c92fec40), [`a136dc9`](https://github.com/halfdomelabs/baseplate/commit/a136dc90ba12783e059fd3c8a067d1b5496ed3ce), [`801c706`](https://github.com/halfdomelabs/baseplate/commit/801c7066f7e943c026f03e71b8d39242036e0cad), [`3029d42`](https://github.com/halfdomelabs/baseplate/commit/3029d42f5d5967721f2b0d5892ea07a80c5f3a1f), [`dfa9638`](https://github.com/halfdomelabs/baseplate/commit/dfa963825c4ba847f9d21f4f014c4dd1722403d6), [`a616ae7`](https://github.com/halfdomelabs/baseplate/commit/a616ae7609285e9aa446997fd342cdb5b303a45d), [`3b3be2b`](https://github.com/halfdomelabs/baseplate/commit/3b3be2b8d45b08552dca3d4e2b5ce391a958341b), [`eadad84`](https://github.com/halfdomelabs/baseplate/commit/eadad8494128ded2cbc76dfbe3b97f93769ea41f), [`801c706`](https://github.com/halfdomelabs/baseplate/commit/801c7066f7e943c026f03e71b8d39242036e0cad), [`ee7ee0e`](https://github.com/halfdomelabs/baseplate/commit/ee7ee0e552090612190eb4446a52c30f4eefce6a), [`801c706`](https://github.com/halfdomelabs/baseplate/commit/801c7066f7e943c026f03e71b8d39242036e0cad), [`dc238be`](https://github.com/halfdomelabs/baseplate/commit/dc238be00158a528a60d9e6ef9cec32b2d8297be), [`bd25ff0`](https://github.com/halfdomelabs/baseplate/commit/bd25ff08e71faeb97b560e7b349dba1967155704), [`8258b27`](https://github.com/halfdomelabs/baseplate/commit/8258b278e9a25a6e4bd5039a134238d071a63ecd), [`7743348`](https://github.com/halfdomelabs/baseplate/commit/7743348b56feb1e03987b6f7d70711b435d17ffe), [`6e2675d`](https://github.com/halfdomelabs/baseplate/commit/6e2675d2166ac9bf470486efdc6a0e48df9bcc6d), [`2f860c5`](https://github.com/halfdomelabs/baseplate/commit/2f860c513a1caf95fdfd0729cf548990166f9a6f), [`83c713b`](https://github.com/halfdomelabs/baseplate/commit/83c713b075eca2abc946e74bf3f03e515e601eba), [`78315cc`](https://github.com/halfdomelabs/baseplate/commit/78315ccd9b0b0330cd2d08584c6d5ec516d641e3), [`bd25ff0`](https://github.com/halfdomelabs/baseplate/commit/bd25ff08e71faeb97b560e7b349dba1967155704), [`cad5352`](https://github.com/halfdomelabs/baseplate/commit/cad535239b47080e30f894383cc330e37213a76c)]:
  - @baseplate-dev/utils@0.6.0
  - @baseplate-dev/project-builder-lib@0.6.0
  - @baseplate-dev/project-builder-server@0.6.0
  - @baseplate-dev/project-builder-web@0.6.0
