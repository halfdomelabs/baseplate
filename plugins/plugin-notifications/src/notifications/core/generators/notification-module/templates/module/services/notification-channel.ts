// @ts-nocheck

import type { RenderedContent } from '$servicesNotificationContent';

/** A resolved notification handed to a channel for delivery. */
export interface ResolvedNotification extends RenderedContent {
  notificationId: string;
  type: string;
  recipientId: string;
}

/** A delivery channel (in-app, email, slack...). */
export interface NotificationChannel {
  deliver(notification: ResolvedNotification): Promise<void>;
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
