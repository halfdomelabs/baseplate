import { getPubSub } from '@src/plugins/graphql/pubsub.js';
import { prisma } from '@src/services/prisma.js';

import type { NotificationChannel } from './notification-channel.js';

/**
 * The in-app channel: signals that the recipient's notifications changed, with
 * the new unseen (badge) count. The count is queried inline (not via the
 * service's `getUnseenCount`) so this leaf never imports the service — the
 * channel dictionary can't cycle back.
 */
export const inAppChannel: NotificationChannel = {
  deliver: async (notification) => {
    const count = await prisma.notification.count({
      where: { recipientId: notification.recipientId, seenAt: null },
    });
    getPubSub().publish('notificationsChanged', notification.recipientId, {
      count,
    });
  },
};
