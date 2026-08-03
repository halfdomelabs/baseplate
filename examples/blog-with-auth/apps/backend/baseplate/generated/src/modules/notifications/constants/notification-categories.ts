/**
 * The categories notification types are grouped under, declared in the project
 * definition and generated here as a closed set.
 *
 * Categories are the unit user preferences are expressed in: the settings UI
 * renders one row per category, and `NotificationPreference.scopeKey` stores
 * these keys. Generating the full set — rather than collecting it from the type
 * registry at runtime — is what lets the settings page list categories no type
 * has been written for yet.
 */
export const NOTIFICATION_CATEGORIES = /* TPL_CATEGORIES:START */ [
  {
    key: 'general',
    label: 'General',
    defaultChannels: ['inApp'],
    mandatory: false,
  },
  {
    key: 'security',
    label: 'Security',
    defaultChannels: ['inApp', 'email'],
    mandatory: true,
  },
] as const /* TPL_CATEGORIES:END */ satisfies readonly NotificationCategory[];

/** A category declared in the project definition. */
interface NotificationCategory {
  key: string;
  label: string;
  /** Channels a type in this category routes to when the user has no preference row. */
  readonly defaultChannels: readonly string[];
  /**
   * Delivery is not the user's choice (password resets, security alerts), so
   * preference rows are never consulted for types in this category.
   */
  mandatory: boolean;
}

/**
 * The key of a declared category.
 *
 * Narrows `category` on a notification type, so deleting or renaming a category
 * in the project definition is a compile error at every `defineNotificationType`
 * site rather than a silently orphaned preference row.
 */
export type NotificationCategoryKey =
  (typeof NOTIFICATION_CATEGORIES)[number]['key'];

const CATEGORIES_BY_KEY = new Map<
  NotificationCategoryKey,
  NotificationCategory
>(NOTIFICATION_CATEGORIES.map((category) => [category.key, category]));

/** Looks up a declared category. Total over {@link NotificationCategoryKey}. */
export function getNotificationCategory(
  key: NotificationCategoryKey,
): NotificationCategory {
  const category = CATEGORIES_BY_KEY.get(key);
  if (!category) {
    throw new Error(`Unknown notification category: ${key}`);
  }
  return category;
}
