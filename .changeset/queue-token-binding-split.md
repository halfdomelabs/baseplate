---
'@baseplate-dev/plugin-queue': patch
---

Queues are now declared with a token/binding split: `defineQueue()` produces an inert, import-safe reference for enqueueing, while `bindQueueHandler()` attaches the handler in a separate file so importing a queue never pulls in its handler's dependencies. BullMQ and pg-boss's generated queue runtimes construct passively (no connection at import time), collect their bindings from feature modules via `AppModule.queues`, and validate for duplicate queue names at startup. Worker entrypoints (`run-workers.ts`) now build their own `AppRuntime` and dispose it on shutdown instead of managing separate init/shutdown globals.
