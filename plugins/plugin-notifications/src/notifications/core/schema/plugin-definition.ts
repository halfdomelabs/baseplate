import type { def } from '@baseplate-dev/project-builder-lib';

import {
  checkUniqueField,
  createEntityType,
  definitionSchema,
  featureEntityType,
  withIssueChecker,
} from '@baseplate-dev/project-builder-lib';
import { CASE_VALIDATORS } from '@baseplate-dev/utils';
import { z } from 'zod';

export const notificationCategoryEntityType = createEntityType(
  'plugin-notifications/notification-category',
);

/**
 * The key of the category every project starts with, and the one
 * `GENERIC_NOTIFICATION_TYPE` (backing `notifyText`) belongs to.
 */
export const DEFAULT_NOTIFICATION_CATEGORY_KEY = 'general';

/**
 * A coarse bucket grouping notification types for user preferences.
 *
 * Categories are declared here rather than in application code because they are
 * the unit the preferences UI renders and the unit `List-Unsubscribe` writes:
 * both need the full set up front, which a runtime registry cannot provide.
 */
export const createNotificationCategorySchema = definitionSchema((ctx) =>
  ctx.withEnt(
    z.object({
      id: z.string(),
      /**
       * Stored in `NotificationPreference.scopeKey` and emitted into the
       * generated `NOTIFICATION_CATEGORIES` const, so renaming one is a data
       * migration for existing rows as well as a compile error at every
       * `defineNotificationType` site.
       */
      key: CASE_VALIDATORS.CAMEL_CASE,
      label: z.string().min(1),
      /** Channels a type in this category routes to when the user has no preference row. */
      defaultChannels: z.array(z.string()).default([]),
      /**
       * Password resets, security alerts — delivery is not the user's choice, so
       * the resolver skips preferences entirely rather than reading rows it
       * would ignore.
       */
      mandatory: z.boolean().default(false),
    }),
    {
      type: notificationCategoryEntityType,
      // The entity's identity is `key`, not a `name` field — `label` is display
      // copy a project can reword freely.
      getNameResolver: (value) => value.key,
    },
  ),
);

export type NotificationCategoryInput = def.InferInput<
  typeof createNotificationCategorySchema
>;

export type NotificationCategory = def.InferOutput<
  typeof createNotificationCategorySchema
>;

/**
 * Builds the `general` category every project starts with.
 *
 * Shared by the plugin defaults, the config migration and the definition editor
 * so a fresh project and an upgraded one cannot disagree about the seed. The
 * array's own `.min(1)` is what guarantees a project is never left with none.
 */
export function buildDefaultNotificationCategory(): NotificationCategory {
  return {
    id: notificationCategoryEntityType.generateNewId(),
    key: DEFAULT_NOTIFICATION_CATEGORY_KEY,
    label: 'General',
    defaultChannels: ['inApp'],
    mandatory: false,
  };
}

/**
 * Configuration schema for the notifications plugin.
 *
 * Tracks the feature the notification module is generated into, plus the
 * categories notification types are grouped under. Notification types
 * themselves are still defined in application code via
 * `defineNotificationType()`.
 */
export const createNotificationsPluginDefinitionSchema = definitionSchema(
  (ctx) =>
    z.object({
      notificationsFeatureRef: ctx.withRef({
        type: featureEntityType,
        onDelete: 'RESTRICT',
      }),
      // At least one: an empty array makes the generated `NotificationCategoryKey`
      // union `never`, which no notification type can satisfy. Enforced here so a
      // hand-edited definition fails at the definition boundary rather than as a
      // raw descriptor error at sync time.
      categories: z
        .array(createNotificationCategorySchema(ctx))
        .min(1, 'At least one notification category is required')
        .apply(
          withIssueChecker(checkUniqueField('key', { label: 'category key' })),
        ),
    }),
);

export type NotificationsPluginDefinition = def.InferOutput<
  typeof createNotificationsPluginDefinitionSchema
>;

export type NotificationsPluginDefinitionInput = def.InferInput<
  typeof createNotificationsPluginDefinitionSchema
>;
