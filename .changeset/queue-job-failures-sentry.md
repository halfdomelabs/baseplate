---
'@baseplate-dev/plugin-queue': patch
---

Queue job handler failures are now routed through the configured error logger. Previously, when a queue job threw (for example an email send failure), the error was written to the application logs but bypassed the error-logger service, so any configured external error handlers (such as Sentry) never received it. Both the pg-boss and BullMQ workers now report handler errors via `logError`, so failures reach every configured error handler in addition to the logs.
