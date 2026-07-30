import { defineQueue } from '@src/types/queue.types.js';

/**
 * Drives the outbox sweep. Separate from the delivery queue because repeatable
 * scheduling and deduplication are fixed at queue creation and are mutually
 * exclusive.
 */
export const notificationOutboxSweepQueue = defineQueue<undefined>(
  'notification-outbox-sweep',
);
