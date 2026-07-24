import type { PubSub } from 'graphql-yoga';

import type { PubSubPublishArgs } from '@src/plugins/graphql/pubsub.js';

/**
 * The notifications module's own view of real-time pub/sub: broadcasting and
 * subscribing to unseen-count changes. The injected port shared by the
 * service and its channels — narrower than the underlying GraphQL pubsub, so
 * that infrastructure type stays out of the rest of the notifications module.
 */
export interface NotificationEvents {
  publishUnseenCount(userId: string, count: number): void;
  subscribeToUnseenCount(userId: string): AsyncIterable<{ count: number }>;
}

/**
 * Adapts the GraphQL Yoga pubsub to {@link NotificationEvents}.
 */
export function createNotificationEvents(
  pubsub: PubSub<PubSubPublishArgs>,
): NotificationEvents {
  return {
    publishUnseenCount(userId, count) {
      pubsub.publish('notificationsChanged', userId, { count });
    },
    subscribeToUnseenCount(userId) {
      return pubsub.subscribe('notificationsChanged', userId);
    },
  };
}
