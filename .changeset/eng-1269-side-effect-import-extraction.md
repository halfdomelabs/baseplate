---
'@baseplate-dev/core-generators': patch
'@baseplate-dev/fastify-generators': patch
---

Template extraction now fails with a clear error when a side-effect import points at project-specific code, instead of silently copying it into a shared template, and side-effect imports between templates in the same generator are now tracked as references.
