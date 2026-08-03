// @ts-nocheck

import type { SystemServiceContextWith } from '%serviceContextImports';

import {
  DELIVERY_EXPIRE_AFTER_MS,
  notificationDeliveryQueue,
} from '$queuesNotificationDelivery';
import { logError } from '%errorHandlerServiceImports';
import { bindQueueHandler } from '%queuesImports';

/**
 * Delivers one chunk of one channel's fan-out. The work lives on the
 * notification service, which owns the installed channels.
 *
 * Failures leave rows `pending` so the queue retries them; once it runs out of
 * attempts, `onFinalAttemptFailure` settles what is left as `failed`. Recording
 * exhaustion here is what keeps it out of the sweeper's expiry count, whose
 * alarm means jobs were lost rather than a channel being down.
 */
export const notificationDeliveryWorker = bindQueueHandler(
  notificationDeliveryQueue,
  {
    handler: async (job, ctx: SystemServiceContextWith<'notificationOutbox'>) =>
      ctx.services.notificationOutbox.deliverChunk({
        ...job.data,
        expireBefore: new Date(Date.now() - DELIVERY_EXPIRE_AFTER_MS),
      }),
    onFinalAttemptFailure: async (jobData, error, ctx) => {
      const count =
        await ctx.services.notificationOutbox.failExhaustedDeliveries(jobData);
      if (count > 0) {
        logError(error, {
          source: 'notification-delivery',
          requestId: jobData.requestId,
          channel: jobData.channel,
          failedCount: count,
          event: 'delivery-retries-exhausted',
        });
      }
    },
    options: {
      defaultJobOptions: {
        // `maxDelaySeconds` is best-effort, so attempts bound the curve.
        attempts: 3,
        backoff: {
          type: 'exponential',
          delaySeconds: 10,
          maxDelaySeconds: 300,
        },
      },
    },
  },
);
