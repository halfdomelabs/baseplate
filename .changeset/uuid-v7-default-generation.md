---
'@baseplate-dev/fastify-generators': patch
---

Add UUID v7 support by replacing `genUuid` boolean with `defaultGeneration` enum (`none` | `uuidv4` | `uuidv7`), leveraging PostgreSQL 18's native `uuidv7()` function
