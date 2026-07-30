// @ts-nocheck

import type { RenderSource } from '$servicesNotificationRenderer';

/** One recipient's share of a delivery, as handed to a channel. */
export interface ChannelDelivery {
  recipientId: string;
  /** Today always one; a future digest can deliver several as one call. */
  notifications: RenderSource[];
  /** Unseen count after this delivery, computed once for the whole chunk. */
  unseenCount: number;
  /**
   * Contact details read at delivery time, so an address changed since enqueue
   * is respected. Passed in because the user model is app-configurable —
   * channels cannot query it themselves.
   */
  recipient: { email: string | null };
  actor: { name: string | null } | null;
}

/** A delivery channel (in-app, email, slack...). */
export interface NotificationChannel {
  /** Sync or async: not every channel does I/O. */
  deliver(delivery: ChannelDelivery): void | Promise<void>;
}

/**
 * The installed delivery channels. Keys are spelled out so an unknown channel
 * is a compile error, not a runtime miss. Assembled in the composition root.
 */
export interface NotificationChannels {
  TPL_CHANNEL_ENTRIES;
}

/** A valid channel key. */
export type NotificationChannelKey = keyof NotificationChannels;
