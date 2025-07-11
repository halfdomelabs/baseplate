---
'@baseplate-dev/project-builder-server': patch
---

Change generated CRUD service file naming from model-service.ts to model.crud.ts pattern

This change updates the service file generation to use explicit `.crud.ts` naming instead of the previous `-service.ts` pattern. This provides better separation between generated CRUD operations and future hand-written business logic files, supporting the planned architectural split between generated and manual code.

Example changes:

- `user-service.ts` → `user.crud.ts`
- `todo-item-service.ts` → `todo-item.crud.ts`
