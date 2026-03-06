---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/fastify-generators': patch
---

Add nested authorizer expressions: `hasRole(model.relation, 'role')` and `hasSomeRole(model.relation, ['role1', 'role2'])` for checking roles on related model authorizers, with autocomplete and linter support
