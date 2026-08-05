import { defineQueue } from '@src/types/queue.types.js';

/** Drives the digest sweep on a schedule. */
export const notificationDigestQueue = defineQueue<undefined>(
  'notification-digest',
);
