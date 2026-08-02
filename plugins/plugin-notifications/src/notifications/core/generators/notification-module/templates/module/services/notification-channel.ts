// @ts-nocheck

import type { RenderSource } from '$servicesNotificationRenderer';

/** One recipient's share of a delivery, as handed to a channel. */
export interface ChannelDelivery {
  recipientId: string;
  /** Today always one; a future digest can deliver several as one call. */
  notifications: RenderSource[];
  /** Contact details, resolved by the service. */
  recipient: { email: string | null };
  actor: { name: string | null } | null;
}

/** A delivery channel (in-app, email, slack...). */
export interface NotificationChannel {
  /** Sync or async: not every channel does I/O. */
  deliver(delivery: ChannelDelivery): void | Promise<void>;
}

/** The installed delivery channels, assembled in the composition root. */
export interface NotificationChannels {
  TPL_CHANNEL_ENTRIES;
}

/** A valid channel key. */
export type NotificationChannelKey = keyof NotificationChannels;

/**
 * Where a notification type may be routed. `'inApp'` is a flag on the row plus
 * an inline publish, and has no {@link NotificationChannel} implementation.
 */
export type NotificationRoutingTarget = NotificationChannelKey | 'inApp';
