---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
---

Added opt-in `skip`/`take` pagination args to to-many relation fields on object types (e.g. `user.todoLists(skip, take)`), mirroring the existing pagination on root list queries. Enable it via a new toggle next to each exposed foreign relation in the GraphQL section of the model editor.
