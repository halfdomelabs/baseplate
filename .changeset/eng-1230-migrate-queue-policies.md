---
'@baseplate-dev/plugin-queue': patch
---

pg-boss repeatable-job queues now log an error on worker startup if their policy hasn't been migrated to `exclusive` (e.g. an existing deployment predating that fix). A new `src/scripts/migrate-queue-policies.ts` script (run via `pnpm script:run`) lets operators review a dry-run plan — including how many pending/active jobs would be lost — and explicitly opt in per queue with `--yes` before applying the fix.
