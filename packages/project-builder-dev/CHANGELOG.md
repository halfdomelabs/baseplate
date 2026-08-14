# @baseplate-dev/project-builder-dev

## 0.6.18

### Patch Changes

- [#1019](https://github.com/halfdomelabs/baseplate/pull/1019) [`eeff7b5`](https://github.com/halfdomelabs/baseplate/commit/eeff7b5895155dc252720d70ced0eca64272ad6a) Thanks [@kingston](https://github.com/kingston)! - `baseplate serve` now reads `.env.local` and `.env` from the current directory, so you can set the port per project with `BASEPLATE_PORT` or `PORT_OFFSET` without exporting shell variables. A plain `PORT` variable is no longer used for the serve port.

- [#1017](https://github.com/halfdomelabs/baseplate/pull/1017) [`eb219ec`](https://github.com/halfdomelabs/baseplate/commit/eb219ec27b78e7b7447ba60bc07900557a783297) Thanks [@kingston](https://github.com/kingston)! - The MCP server and CLI now load action handlers only when an action runs, cutting startup memory substantially, and the MCP server has moved to v2 of the Model Context Protocol SDK.

- Updated dependencies [[`eeff7b5`](https://github.com/halfdomelabs/baseplate/commit/eeff7b5895155dc252720d70ced0eca64272ad6a), [`ce52092`](https://github.com/halfdomelabs/baseplate/commit/ce5209240d4163966967f60cc9fa6286c4f8dcbb), [`6f6e083`](https://github.com/halfdomelabs/baseplate/commit/6f6e0834b3963046e91e509fc6638130f290428e), [`eb219ec`](https://github.com/halfdomelabs/baseplate/commit/eb219ec27b78e7b7447ba60bc07900557a783297), [`a091468`](https://github.com/halfdomelabs/baseplate/commit/a091468889619613d028db530acd42f7ab476d58), [`56fe781`](https://github.com/halfdomelabs/baseplate/commit/56fe781fe175964866ca1fd590a5f5f98007c9c8)]:
  - @baseplate-dev/project-builder-server@0.6.18
  - @baseplate-dev/utils@0.6.18
  - @baseplate-dev/project-builder-lib@0.6.18
  - @baseplate-dev/project-builder-web@0.6.18

## 0.6.17

### Patch Changes

- Updated dependencies [[`b202a97`](https://github.com/halfdomelabs/baseplate/commit/b202a9772434de41a2abcc73c4c96e6f1ddab7c0), [`ff931fb`](https://github.com/halfdomelabs/baseplate/commit/ff931fb61084f65abaf5303a0f156aa6fdde151d)]:
  - @baseplate-dev/project-builder-lib@0.6.17
  - @baseplate-dev/project-builder-server@0.6.17
  - @baseplate-dev/project-builder-web@0.6.17
  - @baseplate-dev/utils@0.6.17

## 0.6.16

### Patch Changes

- [#994](https://github.com/halfdomelabs/baseplate/pull/994) [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552) Thanks [@kingston](https://github.com/kingston)! - Adds a `diff-examples` command that reports which example projects are out of sync with the generators.

- [#994](https://github.com/halfdomelabs/baseplate/pull/994) [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552) Thanks [@kingston](https://github.com/kingston)! - CLI commands now error on unexpected extra arguments instead of silently ignoring them.

- [#994](https://github.com/halfdomelabs/baseplate/pull/994) [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552) Thanks [@kingston](https://github.com/kingston)! - Generated projects now pin pnpm 11.18.0 and use current versions of their runtime dependencies, including major upgrades to bullmq, Stripe, pino, mime-types, react-dropzone and react-day-picker, so a synced project needs a fresh install and may need changes where it calls those libraries directly. File uploads also accept legacy JPEG extensions such as `.jfif` that were previously rejected, and an unrecognized Stripe subscription status now fails the webhook instead of writing a bad value.

- Updated dependencies [[`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552), [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552), [`261d933`](https://github.com/halfdomelabs/baseplate/commit/261d9331ec09c4b60ee17057cbd57feb36827552)]:
  - @baseplate-dev/project-builder-server@0.6.16
  - @baseplate-dev/project-builder-lib@0.6.16
  - @baseplate-dev/project-builder-web@0.6.16
  - @baseplate-dev/utils@0.6.16

## 0.6.15

### Patch Changes

- [#962](https://github.com/halfdomelabs/baseplate/pull/962) [`615c8e1`](https://github.com/halfdomelabs/baseplate/commit/615c8e173cede3cfa0298b92d5b84999ffedce5b) Thanks [@kingston](https://github.com/kingston)! - Tightened handling of indexed access across the codebase, fixing latent cases where a missing array element or record entry could surface as an undefined value in a field typed as required, such as unmatched regular expression capture groups and parsed command strings.

- [#969](https://github.com/halfdomelabs/baseplate/pull/969) [`b936ed2`](https://github.com/halfdomelabs/baseplate/commit/b936ed2aef5c421de9e18f28ba488e4df59f5d61) Thanks [@kingston](https://github.com/kingston)! - The dev MCP server now starts even when a plugin directory cannot be scanned, such as when a package.json still has unresolved merge conflict markers during an upgrade. Discovery failures are reported as warnings and listed by the list-plugins action rather than aborting startup, and a package.json containing conflict markers now reports that the conflict needs resolving instead of a generic JSON parse error.

- Updated dependencies [[`403874a`](https://github.com/halfdomelabs/baseplate/commit/403874a10f67120eb36badc93920359cb267dcb5), [`615c8e1`](https://github.com/halfdomelabs/baseplate/commit/615c8e173cede3cfa0298b92d5b84999ffedce5b), [`b936ed2`](https://github.com/halfdomelabs/baseplate/commit/b936ed2aef5c421de9e18f28ba488e4df59f5d61), [`9cdfaa9`](https://github.com/halfdomelabs/baseplate/commit/9cdfaa9e3702c8a569c5dac739877dc8330a8f73), [`9139686`](https://github.com/halfdomelabs/baseplate/commit/91396867ec7832068aa6a5d19d038dcd1f04ec5c), [`e2ca87e`](https://github.com/halfdomelabs/baseplate/commit/e2ca87e9add6d849081ec73aa99c85a24e3b4817)]:
  - @baseplate-dev/project-builder-lib@0.6.15
  - @baseplate-dev/project-builder-server@0.6.15
  - @baseplate-dev/project-builder-web@0.6.15
  - @baseplate-dev/utils@0.6.15

## 0.6.14

### Patch Changes

- Updated dependencies [[`e7ee500`](https://github.com/halfdomelabs/baseplate/commit/e7ee500e5a2d78778bd3bdb79b4f2f40b5f040ef), [`e7ee500`](https://github.com/halfdomelabs/baseplate/commit/e7ee500e5a2d78778bd3bdb79b4f2f40b5f040ef)]:
  - @baseplate-dev/project-builder-server@0.6.14
  - @baseplate-dev/project-builder-web@0.6.14
  - @baseplate-dev/project-builder-lib@0.6.14
  - @baseplate-dev/utils@0.6.14

## 0.6.13

### Patch Changes

- Updated dependencies [[`7fe29b5`](https://github.com/halfdomelabs/baseplate/commit/7fe29b5d5427d91778da645db4af04a2fe51d2a1), [`80c1474`](https://github.com/halfdomelabs/baseplate/commit/80c1474f8903f0609f8d7484b0d0be8b59d4f6c0), [`9619580`](https://github.com/halfdomelabs/baseplate/commit/9619580e79c50556f649801bd9f04e4f7b221cc3), [`f596b4b`](https://github.com/halfdomelabs/baseplate/commit/f596b4b43bd9f0ecb7d5379739b0e36a01c40c70), [`d0f8726`](https://github.com/halfdomelabs/baseplate/commit/d0f87265f16bfbde6c1525b0655850e906a7c3ed), [`9548f2d`](https://github.com/halfdomelabs/baseplate/commit/9548f2d12af830e28187efed4b5a27d42020b289), [`0d3cd21`](https://github.com/halfdomelabs/baseplate/commit/0d3cd21bec022599977539f65fb2431d28574c83), [`13b78ca`](https://github.com/halfdomelabs/baseplate/commit/13b78caae04ad84441ca48d98a0b9e17135485d9)]:
  - @baseplate-dev/project-builder-web@0.6.13
  - @baseplate-dev/utils@0.6.13
  - @baseplate-dev/project-builder-lib@0.6.13
  - @baseplate-dev/project-builder-server@0.6.13

## 0.6.12

### Patch Changes

- Updated dependencies [[`0620a2b`](https://github.com/halfdomelabs/baseplate/commit/0620a2b2a59a4b401a9d9268f596776f4da09a9b), [`0620a2b`](https://github.com/halfdomelabs/baseplate/commit/0620a2b2a59a4b401a9d9268f596776f4da09a9b), [`0620a2b`](https://github.com/halfdomelabs/baseplate/commit/0620a2b2a59a4b401a9d9268f596776f4da09a9b)]:
  - @baseplate-dev/project-builder-server@0.6.12
  - @baseplate-dev/project-builder-lib@0.6.12
  - @baseplate-dev/project-builder-web@0.6.12
  - @baseplate-dev/utils@0.6.12

## 0.6.11

### Patch Changes

- Updated dependencies [[`bca540b`](https://github.com/halfdomelabs/baseplate/commit/bca540b67711a956a0c0872bfcb7343d81275f9b), [`cc296f4`](https://github.com/halfdomelabs/baseplate/commit/cc296f4737d0462f3536dda27ae9eb297f799b8b), [`05e7b98`](https://github.com/halfdomelabs/baseplate/commit/05e7b98c84069284976b33dfc3426a71a5b9bc64)]:
  - @baseplate-dev/project-builder-server@0.6.11
  - @baseplate-dev/project-builder-lib@0.6.11
  - @baseplate-dev/project-builder-web@0.6.11
  - @baseplate-dev/utils@0.6.11

## 0.6.10

### Patch Changes

- [#900](https://github.com/halfdomelabs/baseplate/pull/900) [`c1e8765`](https://github.com/halfdomelabs/baseplate/commit/c1e8765fb3b59f56db4bc393e7469a54332c94b8) Thanks [@kingston](https://github.com/kingston)! - Upgrade testcontainers to 12.0.2

- [#896](https://github.com/halfdomelabs/baseplate/pull/896) [`f5ad6d2`](https://github.com/halfdomelabs/baseplate/commit/f5ad6d2ff994ecdd03f790b7e5c0915ddc7660c5) Thanks [@kingston](https://github.com/kingston)! - Disable pnpm strictDepBuilds for Baseplate-run installs so generation and e2e
  `pnpm install` do not fail on unreviewed dependency build scripts in freshly
  generated projects
- Updated dependencies [[`192efea`](https://github.com/halfdomelabs/baseplate/commit/192efeac591e3193740da901fb42d0d077063368), [`ffe0818`](https://github.com/halfdomelabs/baseplate/commit/ffe081872b7c99124243e3bb04e73c7b5ddd0f7e), [`4b38b79`](https://github.com/halfdomelabs/baseplate/commit/4b38b79282a32414c688b1f6212b88c0c75d413d), [`30765f0`](https://github.com/halfdomelabs/baseplate/commit/30765f079c46019d9c91fb96f1b3c399b4dc8759), [`4b38b79`](https://github.com/halfdomelabs/baseplate/commit/4b38b79282a32414c688b1f6212b88c0c75d413d), [`0afcb97`](https://github.com/halfdomelabs/baseplate/commit/0afcb979943a6f4f571c56af5e73936ed9d40370)]:
  - @baseplate-dev/project-builder-web@0.6.10
  - @baseplate-dev/project-builder-lib@0.6.10
  - @baseplate-dev/project-builder-server@0.6.10
  - @baseplate-dev/utils@0.6.10

## 0.6.9

### Patch Changes

- Updated dependencies [[`7677630`](https://github.com/halfdomelabs/baseplate/commit/7677630f1e445e2c8c8c56b70435d12b0242affb)]:
  - @baseplate-dev/project-builder-server@0.6.9
  - @baseplate-dev/project-builder-web@0.6.9
  - @baseplate-dev/project-builder-lib@0.6.9
  - @baseplate-dev/utils@0.6.9

## 0.6.8

### Patch Changes

- Updated dependencies [[`8a3552f`](https://github.com/halfdomelabs/baseplate/commit/8a3552fff1e50f1d5b2835eabf7f8e4ef5637d86)]:
  - @baseplate-dev/project-builder-web@0.6.8
  - @baseplate-dev/project-builder-server@0.6.8
  - @baseplate-dev/project-builder-lib@0.6.8
  - @baseplate-dev/utils@0.6.8

## 0.6.7

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/project-builder-server@0.6.7
  - @baseplate-dev/project-builder-lib@0.6.7
  - @baseplate-dev/project-builder-web@0.6.7
  - @baseplate-dev/utils@0.6.7

## 0.6.6

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/project-builder-server@0.6.6
  - @baseplate-dev/project-builder-web@0.6.6
  - @baseplate-dev/project-builder-lib@0.6.6
  - @baseplate-dev/utils@0.6.6

## 0.6.5

### Patch Changes

- Updated dependencies [[`37b6d8f`](https://github.com/halfdomelabs/baseplate/commit/37b6d8fd76086dab2953e12e48543334c5056f15), [`860b82d`](https://github.com/halfdomelabs/baseplate/commit/860b82da0466386ad11128c619595179ee76d0a4), [`9708637`](https://github.com/halfdomelabs/baseplate/commit/97086370718861d2c3170ec6d83af84793fbd09e), [`9708637`](https://github.com/halfdomelabs/baseplate/commit/97086370718861d2c3170ec6d83af84793fbd09e), [`8dcf7b3`](https://github.com/halfdomelabs/baseplate/commit/8dcf7b3c909672487bad61b7a4465d1860092363), [`06f5173`](https://github.com/halfdomelabs/baseplate/commit/06f517371c4904482873a4e30fe9b23b4fd2e36d), [`c24a24a`](https://github.com/halfdomelabs/baseplate/commit/c24a24ac9d2b66623acb0fda9c6ff2b3b80c0a6d), [`71146cd`](https://github.com/halfdomelabs/baseplate/commit/71146cd1ab784f45e4409fef7e6e447750047e48), [`5f7f3f1`](https://github.com/halfdomelabs/baseplate/commit/5f7f3f190e107d96764541a4146320badfe0186d), [`5e182c3`](https://github.com/halfdomelabs/baseplate/commit/5e182c308c51b8d6f735b213ae12ba475c34dbd2), [`0ba6744`](https://github.com/halfdomelabs/baseplate/commit/0ba67445708689622341f3031502b3308f71f68e), [`594e5a1`](https://github.com/halfdomelabs/baseplate/commit/594e5a15cbbff303fd19388ac5ec1639460444bc), [`53b8635`](https://github.com/halfdomelabs/baseplate/commit/53b86354ee6bc4b46d1966f657e3d6c942cf1eb1), [`e18f3e8`](https://github.com/halfdomelabs/baseplate/commit/e18f3e82e86c58fabead4a95bac84d18dfaf3eb6), [`85d957d`](https://github.com/halfdomelabs/baseplate/commit/85d957d4a2ab4b3a55a96c8dbba9a79d2f72511c), [`8d30c14`](https://github.com/halfdomelabs/baseplate/commit/8d30c145ce5d72dcfc038ff076ed0746d2d763cc), [`ed5d250`](https://github.com/halfdomelabs/baseplate/commit/ed5d250146f0b48386a8208741150f9011892a35), [`efcf233`](https://github.com/halfdomelabs/baseplate/commit/efcf2338c018ad46b08e8fef3994630dea511723), [`2a514a6`](https://github.com/halfdomelabs/baseplate/commit/2a514a63e741e1b16b3b1b168b84a60965141887), [`497904a`](https://github.com/halfdomelabs/baseplate/commit/497904a9b5088171f95c5e16bcda542fb5e98610), [`c7131f5`](https://github.com/halfdomelabs/baseplate/commit/c7131f5caebda203ece99d30fcf2d58ead3abdb8), [`c7131f5`](https://github.com/halfdomelabs/baseplate/commit/c7131f5caebda203ece99d30fcf2d58ead3abdb8)]:
  - @baseplate-dev/project-builder-lib@0.6.5
  - @baseplate-dev/project-builder-server@0.6.5
  - @baseplate-dev/project-builder-web@0.6.5
  - @baseplate-dev/utils@0.6.5

## 0.6.4

### Patch Changes

- Updated dependencies [[`ba315aa`](https://github.com/halfdomelabs/baseplate/commit/ba315aaaec0e8842ec7fadb765b1fed5e3abda5a)]:
  - @baseplate-dev/project-builder-lib@0.6.4
  - @baseplate-dev/project-builder-web@0.6.4
  - @baseplate-dev/project-builder-server@0.6.4
  - @baseplate-dev/utils@0.6.4

## 0.6.3

### Patch Changes

- Updated dependencies [[`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931), [`8072019`](https://github.com/halfdomelabs/baseplate/commit/8072019942287ee35720520d08f517272510c931)]:
  - @baseplate-dev/project-builder-lib@0.6.3
  - @baseplate-dev/project-builder-server@0.6.3
  - @baseplate-dev/project-builder-web@0.6.3
  - @baseplate-dev/utils@0.6.3

## 0.6.2

### Patch Changes

- Reset version to 0.6.2 to fix accidental major version bumps caused by missing changeset fixed-group configuration.

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
