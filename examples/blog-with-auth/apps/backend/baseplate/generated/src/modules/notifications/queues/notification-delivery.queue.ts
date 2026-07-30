import { defineQueue } from '@src/types/queue.types.js';

/** One chunk of one channel's fan-out for a single notification request. */
export interface NotificationDeliveryJobData {
  requestId: string;
  channel: string;
  /** Identifies the delivery row this job settles. */
  chunkIndex: number;
  /** Ids, never addresses: the worker re-reads contact details at delivery. */
  recipientIds: string[];
}

/**
 * One delivery queue for every channel, discriminated by `channel` in the
 * payload, so adding a channel needs no new queue.
 */
export const notificationDeliveryQueue =
  defineQueue<NotificationDeliveryJobData>('notification-delivery');
