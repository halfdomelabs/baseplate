---
'@baseplate-dev/core-generators': patch
'@baseplate-dev/fastify-generators': patch
---

Database-backed test suites now create each worker's database once per run instead of checking for it before every test file, and raise the default test timeout to 15s so tests are not failed by a contended CI database.
