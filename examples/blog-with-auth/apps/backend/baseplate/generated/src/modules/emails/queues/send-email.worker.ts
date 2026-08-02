import type { SystemServiceContextWith } from '@src/utils/service-context.js';

import { logger } from '@src/services/logger.js';
import { bindQueueHandler } from '@src/types/queue.types.js';

import { sendEmailQueue } from './send-email.queue.js';

export const sendEmailWorker = bindQueueHandler(sendEmailQueue, {
  handler: async (job, ctx: SystemServiceContextWith<'emailTransport'>) => {
    const messageId = await ctx.services.emailTransport.deliver(
      job.data.message,
    );
    logger.info(
      { template: job.data.template, messageId },
      'Email sent successfully',
    );
  },
});
