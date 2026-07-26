---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
---

Added opt-in pagination, sorting, and filtering to generated GraphQL queries, configurable per model in the GraphQL section of the model editor. Enabling "Connection" generates a Relay-style `<model>sConnection(first, after, last, before)` query backed by Pothos's `t.prismaConnection`; `orderBy` adds multi-field sorting over the fields you mark sortable, with the model's ID field(s) appended as a stable cursor tiebreaker; `where` adds filtering over the fields you mark filterable, composing with row-level authorization and capped in depth and breadth; and to-many relation fields gain optional `skip`/`take` args (e.g. `user.todoLists(skip, take)`).
