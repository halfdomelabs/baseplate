import { builder } from '@src/plugins/graphql/builder.js';

import type { NotificationRoutingTarget } from '../services/notification-channel.js';

import { ROUTING_TARGETS } from '../services/notification-channel.js';

/**
 * Which scope a preference row governs.
 *
 * An enum rather than a string, so an unknown scope is rejected at the schema
 * boundary. The Prisma column stays a plain string — that choice was about
 * keeping this infrastructure model out of the enum catalog, which a GraphQL
 * enum does not touch.
 */
const scopeKindEnum = builder.enumType('NotificationPreferenceScope', {
  values: {
    CATEGORY: {
      value: 'category',
      description:
        'Applies to every type in a category. What a settings page edits.',
    },
    TYPE: {
      value: 'type',
      description:
        'Applies to one notification type. Can only suppress within an enabled category — never re-enable a disabled one.',
    },
  },
});

/**
 * A channel a notification can be routed to, generated from the channels this
 * app installs plus the always-present in-app feed.
 */
const channelEnum = builder.enumType('NotificationChannel', {
  values: Object.fromEntries(
    ROUTING_TARGETS.map((target) => [target, { value: target }]),
  ) as Record<NotificationRoutingTarget, { value: NotificationRoutingTarget }>,
});

/** One channel's resolved state within a category. */
const channelPreferenceType = builder
  .objectRef<{
    channel: NotificationRoutingTarget;
    enabled: boolean;
    isDefault: boolean;
  }>('NotificationChannelPreference')
  .implement({
    fields: (t) => ({
      channel: t.field({ type: channelEnum, resolve: (p) => p.channel }),
      enabled: t.exposeBoolean('enabled'),
      isDefault: t.exposeBoolean('isDefault', {
        description:
          'True when no preference row exists and `enabled` came from the category default.',
      }),
    }),
  });

/**
 * A category as a settings page renders it.
 *
 * `channels` is null for a mandatory category: delivery is not the user's
 * choice there, so there is nothing to toggle.
 */
const categoryPreferenceType = builder
  .objectRef<{
    key: string;
    label: string;
    mandatory: boolean;
    channels?: {
      channel: NotificationRoutingTarget;
      enabled: boolean;
      isDefault: boolean;
    }[];
  }>('NotificationCategoryPreference')
  .implement({
    fields: (t) => ({
      key: t.exposeString('key'),
      label: t.exposeString('label'),
      mandatory: t.exposeBoolean('mandatory', {
        description:
          'When true, preferences are never consulted and `channels` is null.',
      }),
      channels: t.field({
        type: [channelPreferenceType],
        nullable: true,
        resolve: (parent) => parent.channels ?? null,
      }),
    }),
  });

/** The current user's notification settings, one entry per declared category. */
builder.queryField('notificationPreferences', (t) =>
  t.field({
    type: [categoryPreferenceType],
    authorize: ['user'],
    resolve: (_root, _args, context) =>
      context.services.notification.getPreferences(
        context.auth.userIdOrThrow(),
      ),
  }),
);

/**
 * Override one channel for a category or a type.
 *
 * Always scoped to the session user — a caller cannot address someone else's
 * preferences.
 */
builder.mutationField('setNotificationPreference', (t) =>
  t.fieldWithInputPayload({
    authorize: ['user'],
    input: {
      scopeKind: t.input.field({ required: true, type: scopeKindEnum }),
      scopeKey: t.input.string({ required: true }),
      channel: t.input.field({ required: true, type: channelEnum }),
      enabled: t.input.boolean({ required: true }),
    },
    payload: {
      preferences: t.payload.field({ type: [categoryPreferenceType] }),
    },
    resolve: async (_root, { input }, context) => {
      const userId = context.auth.userIdOrThrow();
      await context.services.notification.setPreference(userId, input);
      // Returned so a settings page re-renders from resolved state rather than
      // recomputing the default-vs-override rule itself.
      return {
        preferences: await context.services.notification.getPreferences(userId),
      };
    },
  }),
);

/** Drop an override, restoring the category default. */
builder.mutationField('clearNotificationPreference', (t) =>
  t.fieldWithInputPayload({
    authorize: ['user'],
    input: {
      scopeKind: t.input.field({ required: true, type: scopeKindEnum }),
      scopeKey: t.input.string({ required: true }),
      channel: t.input.field({ required: true, type: channelEnum }),
    },
    payload: {
      cleared: t.payload.field({ type: 'Boolean' }),
      preferences: t.payload.field({ type: [categoryPreferenceType] }),
    },
    resolve: async (_root, { input }, context) => {
      const userId = context.auth.userIdOrThrow();
      const cleared = await context.services.notification.clearPreference(
        userId,
        input,
      );
      return {
        cleared,
        preferences: await context.services.notification.getPreferences(userId),
      };
    },
  }),
);
