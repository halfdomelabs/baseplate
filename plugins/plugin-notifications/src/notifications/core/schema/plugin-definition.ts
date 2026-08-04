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

export const notificationTopicEntityType = createEntityType(
  'plugin-notifications/notification-topic',
);

/**
 * The key of the topic every project starts with, and the one
 * `GENERIC_NOTIFICATION_TYPE` (backing `notifyText`) belongs to.
 */
export const DEFAULT_NOTIFICATION_TOPIC_KEY = 'general';

/** How a channel delivers: not at all, on every event, or batched into a window. */
export const NOTIFICATION_MODES = ['off', 'immediate', 'digest'] as const;

export type NotificationMode = (typeof NOTIFICATION_MODES)[number];

/**
 * A channel's default, in the same shape a preference row carries, so a
 * preference is a sparse override of exactly the thing above it.
 *
 * The bare-string form is sugar for `{ mode }` with no window; both normalize to
 * the object form on parse, so consumers never branch on which was written.
 */
export const createNotificationChannelDefaultSchema = definitionSchema(() =>
  z
    .union([
      z.enum(NOTIFICATION_MODES),
      z.object({
        mode: z.enum(NOTIFICATION_MODES),
        /** Only meaningful for `digest`; ignored otherwise. */
        windowSeconds: z.number().int().positive().optional(),
      }),
    ])
    .transform((value) =>
      typeof value === 'string' ? { mode: value } : value,
    ),
);

/**
 * A group of notification types the user expresses one preference over.
 *
 * Topics are declared here rather than in application code because they are the
 * unit the preferences UI renders and the unit `List-Unsubscribe` writes: both
 * need the full set up front, which a runtime registry cannot provide.
 *
 * Topic membership is also what makes a notification user-controllable at all —
 * a type belonging to no topic consults no preference and is unsuppressible by
 * construction, which is why there is no `mandatory` flag.
 */
export const createNotificationTopicSchema = definitionSchema((ctx) =>
  ctx.withEnt(
    z.object({
      id: z.string(),
      /**
       * Stored in `NotificationPreference.topicKey` and emitted into the
       * generated `NOTIFICATION_TOPICS` const, so renaming one is a data
       * migration for existing rows as well as a compile error at every
       * `defineNotificationType` site.
       */
      key: CASE_VALIDATORS.CAMEL_CASE,
      label: z.string().min(1),
      /** Optional helper copy for the preferences UI. */
      description: z.string().optional(),
      /**
       * Per-channel modes used when the user has no preference row for this
       * topic. A channel absent from the map is `off`, so adding a channel to a
       * project does not silently opt every user into it.
       */
      defaults: z
        .record(z.string(), createNotificationChannelDefaultSchema(ctx))
        .default({}),
    }),
    {
      type: notificationTopicEntityType,
      // The entity's identity is `key`, not a `name` field — `label` is display
      // copy a project can reword freely.
      getNameResolver: (value) => value.key,
    },
  ),
);

export type NotificationTopicInput = def.InferInput<
  typeof createNotificationTopicSchema
>;

export type NotificationTopic = def.InferOutput<
  typeof createNotificationTopicSchema
>;

/**
 * Builds the `general` topic every project starts with.
 *
 * Shared by the plugin defaults, the config migration and the definition editor
 * so a fresh project and an upgraded one cannot disagree about the seed. The
 * array's own `.min(1)` is what guarantees a project is never left with none.
 */
export function buildDefaultNotificationTopic(): NotificationTopic {
  return {
    id: notificationTopicEntityType.generateNewId(),
    key: DEFAULT_NOTIFICATION_TOPIC_KEY,
    label: 'General',
    defaults: { inApp: { mode: 'immediate' } },
  };
}

/**
 * Configuration schema for the notifications plugin.
 *
 * Tracks the feature the notification module is generated into, plus the topics
 * notification types are grouped under. Notification types themselves are still
 * defined in application code via `defineNotificationType()`.
 */
export const createNotificationsPluginDefinitionSchema = definitionSchema(
  (ctx) =>
    z.object({
      notificationsFeatureRef: ctx.withRef({
        type: featureEntityType,
        onDelete: 'RESTRICT',
      }),
      // At least one: an empty array makes the generated `NotificationTopicKey`
      // union `never`, which no notification type can satisfy. Enforced here so a
      // hand-edited definition fails at the definition boundary rather than as a
      // raw descriptor error at sync time.
      topics: z
        .array(createNotificationTopicSchema(ctx))
        .min(1, 'At least one notification topic is required')
        .apply(
          withIssueChecker(checkUniqueField('key', { label: 'topic key' })),
        ),
    }),
);

export type NotificationsPluginDefinition = def.InferOutput<
  typeof createNotificationsPluginDefinitionSchema
>;

export type NotificationsPluginDefinitionInput = def.InferInput<
  typeof createNotificationsPluginDefinitionSchema
>;
