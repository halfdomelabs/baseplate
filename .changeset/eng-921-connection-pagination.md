---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
---

Added opt-in Relay-style cursor pagination for list queries. Enable "Connection" alongside a model's existing "List" query in the GraphQL section of the model editor to generate a `<model>sConnection(first, after, last, before)` query backed by Pothos's `t.prismaConnection`, returning a `<Model>Connection` type with `edges`, `pageInfo`, and `totalCount`.
