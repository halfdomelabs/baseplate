/**
 * Names of the Prisma models contributed by the notifications plugin.
 */
export const NOTIFICATION_MODELS = {
  /** The durable per-recipient record. `inApp` decides whether it shows in the feed. */
  notification: 'Notification',
  /** Transient dispatch record; disposable once its deliveries settle. */
  notificationRequest: 'NotificationRequest',
  /** Per-recipient, per-channel delivery state. */
  notificationDelivery: 'NotificationDelivery',
  /** Sparse per-user channel overrides; absence of a row means "use the default". */
  notificationPreference: 'NotificationPreference',
} as const;
