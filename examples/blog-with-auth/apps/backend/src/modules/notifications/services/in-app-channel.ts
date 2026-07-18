import { getPubSub } from '@src/plugins/graphql/pubsub.js';

import type { NotificationChannel } from './notification-channel.js';

import { registerChannel } from './notification-channel.js';
import { getUnreadCount } from './notification.service.js';

/**
 * The in-app channel. The row is already persisted, so delivery is broadcast-
 * only: publish the new-notification and updated-count real-time events.
 */
export const inAppChannel: NotificationChannel = {
  key: 'inApp',
  deliver: async (notification) => {
    const pubSub = getPubSub();
    const count = await getUnreadCount(notification.recipientId);
    pubSub.publish('notificationReceived', notification.recipientId, {
      notificationId: notification.notificationId,
    });
    pubSub.publish('unreadCountChanged', notification.recipientId, { count });
  },
};

registerChannel(inAppChannel);
