// @ts-nocheck

import { sendEmailQueue } from '$sendEmailQueue';
import { logger } from '%loggerServiceImports';
import { bindQueueHandler } from '%queuesImports';

export const sendEmailWorker = bindQueueHandler(sendEmailQueue, {
  handler: async (job) => {
    const messageId = await TPL_EMAIL_ADAPTER.sendMail(job.data.message);
    logger.info(
      {
        template: job.data.template,
        messageId,
      },
      `Email sent successfully using ${TPL_EMAIL_ADAPTER.name}`,
    );
  },
});
