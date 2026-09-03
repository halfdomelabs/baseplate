---
'@baseplate-dev/core-generators': patch
'@baseplate-dev/project-builder-server': patch
---

Template extraction now fails when a template declares a `projectExports` entry that its source file no longer exports, naming the template, symbol and file, so renaming or deleting an export no longer leaves a stale entry that breaks an unrelated generator later. Configuring a template's exports now records a default export as `exportedAs: 'default'` rather than silently dropping it.
