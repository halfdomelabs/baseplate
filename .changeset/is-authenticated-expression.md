---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/fastify-generators': patch
---

Add `isAuthenticated` boolean to authorizer expression DSL and AuthContext. Warn when `hasRole('user')` is used, suggesting `isAuthenticated` instead.
