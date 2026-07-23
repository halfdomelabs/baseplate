import { logger } from '@src/services/logger.js';
import { bindQueueHandler } from '@src/types/queue.types.js';

import { postmarkEmailAdapter } from '../services/postmark.service.js';
import { sendEmailQueue } from './send-email.queue.js';

export const sendEmailWorker = bindQueueHandler(sendEmailQueue, {
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
