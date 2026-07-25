import type { RenderedContent } from './notification-content.js';
import type { NotificationEvents } from './notification-events.js';

import { createInAppChannel } from './in-app-channel.js';

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
export type NotificationChannels = Record<string, NotificationChannel>;

/** Builds the delivery channel dictionary, wiring runtime deps into each channel. */
export function createChannels(deps: {
  events: NotificationEvents;
}): NotificationChannels {
  return {
    inApp: createInAppChannel(deps),
  } satisfies Record<string, NotificationChannel>;
}

/** A valid channel key. */
export type NotificationChannelKey = keyof ReturnType<typeof createChannels>;
