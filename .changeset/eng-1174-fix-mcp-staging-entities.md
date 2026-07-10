---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/create-project': patch
---

Fix two issues with staging entities through the MCP server (ENG-1174):

- **Enums array default:** the top-level `enums` field was declared `.optional()` while
  its sibling arrays (`apps`, `libraries`, `models`) all default to `[]`. A definition
  written without an `enums` key parsed to `undefined`, causing a runtime `TypeError` when
  staging an enum. `enums` now defaults to `[]` like the others. `cleanDefaultValues`
  strips the empty default on serialize, so on-disk definitions stay unchanged.
- **Corrupt draft recovery:** a draft session persisted by an older CLI could be
  structurally invalid (e.g. missing entity `id` fields). `getOrCreateDraftSession` then
  rethrew a cryptic error on every staging call and the draft could not be advanced. It now
  detects an unparseable persisted draft and surfaces an actionable error pointing at
  `discard-draft` (which clears the draft without parsing it), so the session can be reset.

Initializers now emit `enums: []`, and the redundant `enums ?? []` / `enums?.` guards
across `project-builder-server`, `project-builder-web`, and `create-project` are dropped
now that `enums` is always an array.
