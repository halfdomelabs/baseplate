// @ts-nocheck

import type { TransformedEmailMessage } from '$emailTypes';

import { defineQueue } from '%queuesImports';

export interface SendEmailJobData {
  message: TransformedEmailMessage;
  template?: string;
}

export const sendEmailQueue = defineQueue<SendEmailJobData>('send-email');
