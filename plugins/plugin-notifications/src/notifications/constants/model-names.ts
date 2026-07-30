/**
 * Names of the Prisma models contributed by the notifications plugin.
 */
export const NOTIFICATION_MODELS = {
  /** The durable in-app row: content plus its seen/read state. */
  notificationFeedItem: 'NotificationFeedItem',
  /** Transient dispatch record; disposable once its deliveries settle. */
  notificationRequest: 'NotificationRequest',
  /** Per-job delivery state; dies with its request. */
  notificationDelivery: 'NotificationDelivery',
} as const;
