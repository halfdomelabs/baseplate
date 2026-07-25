// @ts-nocheck

import type { ServiceContextWith } from '%serviceContextImports';

import { sendEmailQueue } from '$sendEmailQueue';
import { logger } from '%loggerServiceImports';
import { bindQueueHandler } from '%queuesImports';

export const sendEmailWorker = bindQueueHandler(sendEmailQueue, {
  handler: async (job, ctx: ServiceContextWith<'emailTransport'>) => {
    const messageId = await ctx.services.emailTransport.deliver(
      job.data.message,
    );
    logger.info(
      { template: job.data.template, messageId },
      'Email sent successfully',
    );
  },
});
