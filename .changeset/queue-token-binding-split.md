---
'@baseplate-dev/plugin-queue': patch
---

Queues are now declared with a token/binding split: `defineQueue()` produces an inert, import-safe reference for enqueueing, while `bindQueueHandler()` attaches the handler in a separate file, so importing a queue never pulls in its handler's dependencies. The BullMQ and pg-boss runtimes construct passively with no connection at import time, collect their bindings from feature modules via `AppModule.queues`, and validate for duplicate queue names at startup.
