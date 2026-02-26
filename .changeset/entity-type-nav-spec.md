---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-web': patch
---

Refactor entity type URL registration to use a plugin spec with a typed discriminated union navigation target system. Builders now register via `entityTypeUrlWebSpec.register(entityType, builder)` with params typed based on whether the entity has a parent — `parentId` and `parentKey` are required strings for child entity types and `undefined` for root entity types.
