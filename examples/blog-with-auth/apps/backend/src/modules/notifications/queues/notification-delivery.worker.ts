import type { ServiceContextWith } from '@src/utils/service-context.js';

import { bindQueueHandler } from '@src/types/queue.types.js';

import { notificationDeliveryQueue } from './notification-delivery.queue.js';

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
        // Capped low: `maxDelaySeconds` is best-effort, so attempts bound the curve.
        attempts: 5,
        backoff: {
          type: 'exponential',
          delaySeconds: 10,
          maxDelaySeconds: 300,
        },
      },
    },
  },
);
