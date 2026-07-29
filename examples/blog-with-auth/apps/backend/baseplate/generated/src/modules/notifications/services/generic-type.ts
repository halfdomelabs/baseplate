import { z } from 'zod';

import { defineNotificationType } from './notification-registry.js';

const genericParamsSchema = z.object({
  text: z.string(),
  actionUrl: z.string().optional(),
});

/** Built-in type backing `notifyText`: renders plain text + optional actionUrl. */
export const GENERIC_NOTIFICATION_TYPE = defineNotificationType({
  key: 'generic',
  version: 1,
  paramsSchema: genericParamsSchema,
  channels: ['inApp'],
  render: (events) => {
    const event = events[0];
    if (!event) {
      throw new Error('Expected at least one event to render');
    }
    return {
      body: event.params.text,
      actionUrl: event.params.actionUrl,
    };
  },
});
