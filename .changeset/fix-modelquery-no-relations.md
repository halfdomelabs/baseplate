---
'@baseplate-dev/fastify-generators': patch
---

Improve data operations DX: rename `ModelQuery` to `ModelInclude`, fix `GetPayload` to eliminate `Payload | {}` union, and use intermediate variable for commit results. Fix type error for relation-less models by omitting query spread from execute callbacks.
