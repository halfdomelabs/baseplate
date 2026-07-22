// @ts-nocheck

import type { RenderedContent } from '$servicesNotificationContent';

import { inAppChannel } from '$servicesInAppChannel';

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

/** The available delivery channels, keyed by channel key. */
export const CHANNELS = {
  inApp: inAppChannel,
} satisfies Record<string, NotificationChannel>;

/** A valid channel key. */
export type NotificationChannelKey = keyof typeof CHANNELS;

/** Look up a channel by key. */
export function getChannel(key: NotificationChannelKey): NotificationChannel {
  return CHANNELS[key];
}
