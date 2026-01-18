// @ts-nocheck

import type { TransformedEmailMessage } from '$emailsTypes';

import { logger } from '%loggerServiceImports';
import { createQueue } from '%queueServiceImports';

interface SendEmailJobData {
  message: TransformedEmailMessage;
  template?: string;
}

export const sendEmailQueue = createQueue<SendEmailJobData>('send-email', {
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
