import { prisma } from '@src/services/prisma.js';

import type { NotificationChannel } from './notification-channel.js';
import type { NotificationEvents } from './notification-events.js';

/**
 * The in-app channel: signals that the recipient's notifications changed, with
 * the new unseen (badge) count. The count is queried inline (not via the
 * service's `getUnseenCount`) so this leaf never imports the service — the
 * channel dictionary can't cycle back.
 */
export function createInAppChannel(deps: {
  events: NotificationEvents;
}): NotificationChannel {
  const { events } = deps;
  return {
    deliver: async (notification) => {
      const count = await prisma.notification.count({
        where: { recipientId: notification.recipientId, seenAt: null },
      });
      events.publishUnseenCount(notification.recipientId, count);
    },
  };
}
