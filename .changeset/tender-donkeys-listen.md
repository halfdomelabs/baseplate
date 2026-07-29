---
'@baseplate-dev/project-builder-server': patch
---

Read queries now honour a model's `instanceRoles` when deriving the GraphQL `authorize` gate, so an ownership-style read permission no longer rejects the owner or fails to build the schema. Gates derived from instance roles now emit just the role that covers them (typically `user`) instead of listing every configured role.
