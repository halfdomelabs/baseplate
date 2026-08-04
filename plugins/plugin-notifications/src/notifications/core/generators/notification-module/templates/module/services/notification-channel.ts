// @ts-nocheck

import type { RenderSource } from '$servicesNotificationRenderer';

/** One recipient's share of a delivery, as handed to a channel. */
export interface ChannelDelivery {
  recipientId: string;
  notification: RenderSource;
  /** Contact details, resolved by the service. */
  recipient: { email: string | null };
}

/** A delivery channel (in-app, email, slack...). */
export interface NotificationChannel {
  deliver(delivery: ChannelDelivery): Promise<void>;
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

/**
 * Every routing target, for enumerating rather than checking one — the settings
 * API lists a state per target. Rendered from the same source as the channel
 * interface above, so the runtime list and the compile-time union cannot drift.
 */
export const ROUTING_TARGETS =
  TPL_ROUTING_TARGETS satisfies readonly NotificationRoutingTarget[];
