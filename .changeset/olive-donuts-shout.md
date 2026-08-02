---
'@baseplate-dev/fastify-generators': patch
---

Backend services are now split into a public `AppServices` tier reachable from request contexts and an `InternalServices` tier that only workers and scripts can reach, so a resolver naming an internal service is a compile error.
