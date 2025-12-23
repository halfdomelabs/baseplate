---
'@baseplate-dev/plugin-queue': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/fastify-generators': patch
---

Add BullMQ plugin as managed child of queue plugin

- Create new BullMQ plugin (`@baseplate-dev/plugin-queue/bullmq`) following the pg-boss plugin pattern
- Add migration (021) to migrate `enableBullQueue` from backend app config to queue/bullmq plugin config
- Remove old `bullMqGenerator` and `fastifyBullBoardGenerator` from fastify-generators
- Remove Bull Board integration (to be replaced with local alternative in the future)
- Remove `enableBullQueue` option from backend app schema and UI
