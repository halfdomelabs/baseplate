// @ts-nocheck

import { defineNotificationType } from '$servicesNotificationRegistry';
import { z } from 'zod';

const genericParamsSchema = z.object({
  text: z.string(),
  actionUrl: z.string().optional(),
});

/** Built-in type backing `notifyText`: renders plain text + optional actionUrl. */
export const GENERIC_NOTIFICATION_TYPE = defineNotificationType({
  key: 'generic',
  version: 1,
  topic: 'general',
  paramsSchema: genericParamsSchema,
  channels: ['inApp'],
  render: (params) => ({
    title: params.text,
    actionUrl: params.actionUrl,
  }),
});
