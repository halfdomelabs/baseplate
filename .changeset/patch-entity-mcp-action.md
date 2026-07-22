---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
---

Add a stage-patch-entity MCP action that stages a partial entity update, replacing only the provided root-level fields while preserving the rest of the entity. This complements stage-update-entity, which replaces the whole entity.
