import { defineQueue } from '@src/types/queue.types.js';

/** Drives the retention sweep on a schedule. */
export const notificationRetentionQueue = defineQueue<undefined>(
  'notification-retention',
);
