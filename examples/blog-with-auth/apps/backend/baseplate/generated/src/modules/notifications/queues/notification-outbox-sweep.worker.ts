import type { SystemServiceContextWith } from '@src/utils/service-context.js';

import { logError } from '@src/services/error-logger.js';
import { bindQueueHandler } from '@src/types/queue.types.js';

import { DELIVERY_EXPIRE_AFTER_MS } from './notification-delivery.queue.js';
import { notificationOutboxSweepQueue } from './notification-outbox-sweep.queue.js';

/** Longer than a hand-off takes, so one still in flight isn't run twice. */
const STALE_AFTER_MS = 10 * 60 * 1000;

/** Requests re-run per pass. */
const SWEEP_BATCH_SIZE = 100;

/**
 * Re-runs interrupted fan-outs, then retires deliveries whose jobs were lost.
 *
 * Jobs are enqueued after the transaction commits, so a crash in between leaves
 * rows written and nothing to run them. That is the gap the queue's own
 * durability cannot cover.
 *
 * The expiry pass should match nothing — the delivery worker expires rows as it
 * goes — so a non-zero count is logged as an error.
 *
 * For alerting: an exhausted delivery is settled `failed` by the delivery
 * queue's `onFinalAttemptFailure`, so the job completes rather than ending in
 * the backend's failed state. Channel health is the `failed` count.
 */
export const notificationOutboxSweepWorker = bindQueueHandler(
  notificationOutboxSweepQueue,
  {
    handler: async (
      _job,
      ctx: SystemServiceContextWith<'notificationOutbox'>,
    ) => {
      const outbox = ctx.services.notificationOutbox;
      const sweptCount = await outbox.sweepStaleRequests({
        staleBefore: new Date(Date.now() - STALE_AFTER_MS),
        limit: SWEEP_BATCH_SIZE,
      });

      const expiredCount = await outbox.expireStaleDeliveries({
        expireBefore: new Date(Date.now() - DELIVERY_EXPIRE_AFTER_MS),
      });
      if (expiredCount > 0) {
        logError(
          new Error(
            `Expired ${expiredCount} notification deliveries whose jobs never ran`,
          ),
          { source: 'notification-outbox-sweep', expiredCount },
        );
      }

      return { sweptCount, expiredCount };
    },
    repeatable: {
      // Offset so this misses the other plugins' hourly crons.
      pattern: '7,17,27,37,47,57 * * * *',
    },
  },
);
