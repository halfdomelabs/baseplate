---
'@baseplate-dev/plugin-queue': patch
---

Renamed the `services.queues` app-runtime key to `services.queue` (for both BullMQ and pg-boss backends) for consistency with the codebase's singular service-naming convention. The `AppModule.queues` worker-bindings collection field is unaffected.
