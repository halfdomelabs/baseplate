import type { NotificationChannel } from './notification-channel.js';
import type { NotificationEvents } from './notification-events.js';

/**
 * The in-app channel: broadcasts the recipient's new unseen (badge) count.
 *
 * Runs in the delivery worker, so the badge lands just after the mutation that
 * triggered it.
 */
export function createInAppChannel(deps: {
  events: NotificationEvents;
}): NotificationChannel {
  const { events } = deps;
  return {
    deliver: ({ recipientId, unseenCount }) => {
      events.publishUnseenCount(recipientId, unseenCount);
    },
  };
}
