// @ts-nocheck

import type { NotificationChannel } from '$servicesNotificationChannel';

import { prisma } from '%prismaImports';
import { getPubSub } from '%yogaPluginImports';

/**
 * The in-app channel: publishes the new-notification and unread-count events.
 * The count is queried inline (not via the service's `getUnreadCount`) so this
 * leaf never imports the service — the channel dictionary can't cycle back.
 */
export const inAppChannel: NotificationChannel = {
  deliver: async (notification) => {
    const pubSub = getPubSub();
    const count = await prisma.notification.count({
      where: { recipientId: notification.recipientId, readAt: null },
    });
    pubSub.publish('notificationReceived', notification.recipientId, {
      notificationId: notification.notificationId,
    });
    pubSub.publish('unreadCountChanged', notification.recipientId, { count });
  },
};
