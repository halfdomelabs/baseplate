---
'@baseplate-dev/project-builder-web': patch
---

Fix model form not marking as dirty when deleting relations or unique constraints

- Replace `setValue` with `useController` in `ModelRelationsSection` and `ModelUniqueConstraintsSection` so that deletions properly dirty the form
