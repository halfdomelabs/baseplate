import { logger } from '@src/services/logger.js';
import { createQueue } from '@src/services/pg-boss.service.js';

import type { TransformedEmailMessage } from '../emails.types.js';

import { postmarkEmailAdapter } from '../services/postmark.service.js';

interface SendEmailJobData {
  message: TransformedEmailMessage;
  template?: string;
}

export const sendEmailQueue = createQueue<SendEmailJobData>('send-email', {
  handler: async (job) => {
    const messageId =
      await /* TPL_EMAIL_ADAPTER:START */ postmarkEmailAdapter /* TPL_EMAIL_ADAPTER:END */
        .sendMail(job.data.message);
    logger.info(
      {
        template: job.data.template,
        messageId,
      },
      `Email sent successfully using ${/* TPL_EMAIL_ADAPTER:START */ postmarkEmailAdapter /* TPL_EMAIL_ADAPTER:END */.name}`,
    );
  },
});
