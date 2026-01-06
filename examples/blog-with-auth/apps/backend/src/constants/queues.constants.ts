import { sendEmailQueue } from '@src/modules/emails/queues/send-email.queue.js';

import type { Queue } from '../types/queue.types.js';

/**
 * Central registry for all application queues.
 * Add new queues here as they are created.
 */

/**
 * Registry of all active queues in the application.
 */
export const QUEUE_REGISTRY: Queue<unknown>[] = /* TPL_QUEUE_LIST:START */ [
  sendEmailQueue,
]; /* TPL_QUEUE_LIST:END */
