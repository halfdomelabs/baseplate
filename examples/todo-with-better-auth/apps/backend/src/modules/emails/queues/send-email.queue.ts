import { defineQueue } from '@src/types/queue.types.js';

import type { TransformedEmailMessage } from '../emails.types.js';

export interface SendEmailJobData {
  message: TransformedEmailMessage;
  template?: string;
}

export const sendEmailQueue = defineQueue<SendEmailJobData>('send-email');
