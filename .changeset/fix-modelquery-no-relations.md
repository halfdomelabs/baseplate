---
'@baseplate-dev/fastify-generators': patch
---

Fix type error in generated data services for models without relations by omitting query spread from execute callbacks when the model has no include support.