---
'@baseplate-dev/fastify-generators': patch
---

Model policy actions now always return a where clause from `.where()`, using an empty clause for unrestricted grants instead of `undefined`, so an authorization filter can no longer be spread into a query as "no filter" and silently widen it. Denied grants continue to throw.
