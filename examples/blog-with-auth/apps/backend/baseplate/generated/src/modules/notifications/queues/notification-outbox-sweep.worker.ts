import type { ServiceContextWith } from '@src/utils/service-context.js';

import { bindQueueHandler } from '@src/types/queue.types.js';

import { notificationOutboxSweepQueue } from './notification-outbox-sweep.queue.js';

/** Longer than the delivery retry window, so a retrying job isn't swept. */
const STALE_AFTER_MS = 10 * 60 * 1000;

/** Deliveries re-driven per run. */
const SWEEP_BATCH_SIZE = 100;

/**
 * Re-drives deliveries stuck `pending`.
 *
 * Covers what the queue's own retries cannot: `enqueue` runs after the
 * transaction commits, so a failure there leaves no job to retry.
 */
export const notificationOutboxSweepWorker = bindQueueHandler(
  notificationOutboxSweepQueue,
  {
    handler: async (_job, ctx: ServiceContextWith<'notification'>) => {
      const sweptCount = await ctx.services.notification.sweepStaleDeliveries({
        staleBefore: new Date(Date.now() - STALE_AFTER_MS),
        limit: SWEEP_BATCH_SIZE,
      });
      return { sweptCount };
    },
    repeatable: {
      // Offset so this misses the other plugins' hourly crons.
      pattern: '7,17,27,37,47,57 * * * *',
    },
  },
);
