import { defineQueue } from '@src/types/queue.types.js';

/**
 * Age past which a delivery still unsent is abandoned. Shared: the sweep's
 * "anything I find was lost" reading only holds while it matches the delivery
 * worker's window.
 */
export const DELIVERY_EXPIRE_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

/** One chunk of one channel's fan-out for a single notification request. */
export interface NotificationDeliveryJobData {
  /** Carried for logging; not read for delivery. */
  requestId: string;
  channel: string;
  /**
   * The rows this job settles. Ids, never addresses or rendered copy: the
   * worker re-reads both at delivery time, so a copy fix or an address change
   * reaches mail that has not gone out yet.
   */
  notificationIds: string[];
}

/**
 * One delivery queue for every channel, discriminated by `channel` in the
 * payload, so adding a channel needs no new queue.
 */
export const notificationDeliveryQueue =
  defineQueue<NotificationDeliveryJobData>('notification-delivery');
