import type { SystemServiceContextWith } from '@src/utils/service-context.js';

import { bindQueueHandler } from '@src/types/queue.types.js';

import {
  DELIVERY_EXPIRE_AFTER_MS,
  notificationDeliveryQueue,
} from './notification-delivery.queue.js';

/** Retry budget for a delivery job; the worker settles leftovers on the last. */
const DELIVERY_ATTEMPTS = 3;

/**
 * Delivers one chunk of one channel's fan-out. The work lives on the
 * notification service, which owns the installed channels.
 */
export const notificationDeliveryWorker = bindQueueHandler(
  notificationDeliveryQueue,
  {
    handler: async (job, ctx: SystemServiceContextWith<'notificationOutbox'>) =>
      ctx.services.notificationOutbox.deliverChunk({
        ...job.data,
        // Nothing will retry after this, so the worker records the outcome
        // instead of leaving rows pending forever.
        isFinalAttempt: job.attemptNumber >= DELIVERY_ATTEMPTS,
        expireBefore: new Date(Date.now() - DELIVERY_EXPIRE_AFTER_MS),
      }),
    options: {
      defaultJobOptions: {
        // `maxDelaySeconds` is best-effort, so attempts bound the curve.
        attempts: DELIVERY_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delaySeconds: 10,
          maxDelaySeconds: 300,
        },
      },
    },
  },
);
