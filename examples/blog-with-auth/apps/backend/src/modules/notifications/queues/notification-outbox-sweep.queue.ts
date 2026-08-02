import { defineQueue } from '@src/types/queue.types.js';

/** Drives the outbox sweep on a schedule. */
export const notificationOutboxSweepQueue = defineQueue<undefined>(
  'notification-outbox-sweep',
);
