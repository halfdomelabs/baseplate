import type { RenderedContent } from './notification-content.js';

import { getCurrentNotificationTypes } from './notification-registry.js';

/** A resolved notification handed to a channel for delivery. */
export interface ResolvedNotification extends RenderedContent {
  notificationId: string;
  type: string;
  recipientId: string;
}

/**
 * A delivery channel (in-app, email, slack...). Add one by implementing this and
 * registering it; it never touches notification types. `deliver` owns "can I
 * reach this recipient?" — it throws if not, and dispatch isolates it. Per-user
 * preferences belong in the engine (added later), not here.
 */
export interface NotificationChannel {
  /** Channel key, matches `NotificationTypeDefinition.channels` entries. */
  key: string;
  /** Render (channel-specific) + deliver. In-app broadcasts; others enqueue. */
  deliver(notification: ResolvedNotification): Promise<void>;
}

const channels = new Map<string, NotificationChannel>();

/** Register a delivery channel (call at module load). */
export function registerChannel(channel: NotificationChannel): void {
  if (channels.has(channel.key)) {
    throw new Error(
      `Notification channel "${channel.key}" is already registered`,
    );
  }
  channels.set(channel.key, channel);
}

/** Look up a registered channel by key. */
export function getChannel(key: string): NotificationChannel | undefined {
  return channels.get(key);
}

/**
 * Fail fast at startup if a type's CURRENT version declares a channel nobody
 * registered. Only the active version's channels are checked: historical
 * versions are read-only renderers, so retiring a channel must not fail startup
 * just because an old version still mentions it.
 */
export function validateNotificationRegistry(): void {
  const missing = getCurrentNotificationTypes().flatMap((type) =>
    type.channels
      .filter((key) => !channels.has(key))
      .map((key) => `${type.key}@${type.version} -> "${key}"`),
  );
  if (missing.length > 0) {
    throw new Error(
      `Notification types declare unregistered channels: ${missing.join(', ')}`,
    );
  }
}
