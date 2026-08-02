// @ts-nocheck

import type { ServiceContextWith } from '%serviceContextImports';

import { DELIVERY_EXPIRE_AFTER_MS } from '$queuesNotificationDelivery';
import { notificationOutboxSweepQueue } from '$queuesNotificationOutboxSweep';
import { logError } from '%errorHandlerServiceImports';
import { bindQueueHandler } from '%queuesImports';

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
 * For alerting: an exhausted delivery is settled `failed` rather than rethrown,
 * so it never reaches the DLQ. Channel health is the `failed` count.
 */
export const notificationOutboxSweepWorker = bindQueueHandler(
  notificationOutboxSweepQueue,
  {
    handler: async (_job, ctx: ServiceContextWith<'notificationOutbox'>) => {
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
