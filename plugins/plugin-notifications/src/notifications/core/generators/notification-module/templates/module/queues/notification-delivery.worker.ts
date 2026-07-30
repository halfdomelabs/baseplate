// @ts-nocheck

import type { ServiceContextWith } from '%serviceContextImports';

import { notificationDeliveryQueue } from '$queuesNotificationDelivery';
import { bindQueueHandler } from '%queuesImports';

/** Capped low: `maxDelaySeconds` is best-effort, so attempts bound the curve. */
const DELIVERY_ATTEMPTS = 5;
const DELIVERY_BACKOFF = {
  type: 'exponential',
  delaySeconds: 10,
  maxDelaySeconds: 300,
} as const;

/**
 * Delivers one chunk of one channel's fan-out. The work lives on the
 * notification service, which owns the installed channels.
 */
export const notificationDeliveryWorker = bindQueueHandler(
  notificationDeliveryQueue,
  {
    handler: async (job, ctx: ServiceContextWith<'notification'>) =>
      ctx.services.notification.deliverChunk(job.data),
    options: {
      // Drops a duplicate enqueue while the job is pending or active.
      deduplication: true,
      defaultJobOptions: {
        attempts: DELIVERY_ATTEMPTS,
        backoff: DELIVERY_BACKOFF,
      },
    },
  },
);
