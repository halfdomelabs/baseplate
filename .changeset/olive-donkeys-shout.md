---
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/project-builder-lib': patch
---

Support one-to-many relations in model authorizer expressions, so `hasRole(model.members, 'owner')` now delegates to a role on a has-many relation ("some related record grants the role") instead of failing to build, and the expression editor suggests has-many relations for `hasRole`/`hasSomeRole` alongside belongs-to ones.
