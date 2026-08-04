import { builder } from '@src/plugins/graphql/builder.js';

import type { NotificationRoutingTarget } from '../services/notification-channel.js';
import type { NotificationChannelPreference } from '../services/notification.service.js';

import { NOTIFICATION_MODES } from '../constants/notification-topics.js';
import { ROUTING_TARGETS } from '../services/notification-channel.js';

/**
 * How a channel delivers.
 *
 * An enum rather than a string, so an unknown mode is rejected at the schema
 * boundary. The Prisma column stays a plain string — that choice was about
 * keeping this infrastructure model out of the enum catalog, which a GraphQL
 * enum does not touch.
 */
const modeEnum = builder.enumType('NotificationMode', {
  values: Object.fromEntries(
    NOTIFICATION_MODES.map((mode) => [mode.toUpperCase(), { value: mode }]),
  ),
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

/** One channel's resolved state within a topic. */
const channelPreferenceType = builder
  .objectRef<NotificationChannelPreference>('NotificationChannelPreference')
  .implement({
    fields: (t) => ({
      channel: t.field({ type: channelEnum, resolve: (p) => p.channel }),
      mode: t.field({ type: modeEnum, resolve: (p) => p.mode }),
      digestWindowSeconds: t.int({
        nullable: true,
        description:
          'The digest window in effect, inherited from the topic when the row does not name one. Null unless `mode` is DIGEST.',
        resolve: (p) => p.digestWindowSeconds ?? null,
      }),
      isDefault: t.exposeBoolean('isDefault', {
        description:
          'True when no preference row exists and the setting came from the topic default.',
      }),
    }),
  });

/**
 * A topic as a settings page renders it.
 *
 * Types belonging to no topic are deliberately absent: they consult no
 * preference, so there is nothing here to toggle.
 */
const topicPreferenceType = builder
  .objectRef<{
    key: string;
    label: string;
    description?: string;
    channels: NotificationChannelPreference[];
  }>('NotificationTopicPreference')
  .implement({
    fields: (t) => ({
      key: t.exposeString('key'),
      label: t.exposeString('label'),
      description: t.exposeString('description', { nullable: true }),
      channels: t.field({
        type: [channelPreferenceType],
        resolve: (parent) => parent.channels,
      }),
    }),
  });

/** The current user's notification settings, one entry per declared topic. */
builder.queryField('notificationPreferences', (t) =>
  t.field({
    type: [topicPreferenceType],
    authorize: ['user'],
    resolve: (_root, _args, context) =>
      context.services.notification.getPreferences(
        context.auth.userIdOrThrow(),
      ),
  }),
);

/**
 * Override one channel for a topic.
 *
 * Always scoped to the session user — a caller cannot address someone else's
 * preferences.
 */
builder.mutationField('setNotificationPreference', (t) =>
  t.fieldWithInputPayload({
    authorize: ['user'],
    input: {
      topicKey: t.input.string({ required: true }),
      channel: t.input.field({ required: true, type: channelEnum }),
      mode: t.input.field({ required: true, type: modeEnum }),
      digestWindowSeconds: t.input.int({ required: false }),
    },
    payload: {
      preferences: t.payload.field({ type: [topicPreferenceType] }),
    },
    resolve: async (_root, { input }, context) => {
      const userId = context.auth.userIdOrThrow();
      await context.services.notification.setPreference(userId, {
        ...input,
        digestWindowSeconds: input.digestWindowSeconds ?? undefined,
      });
      // Returned so a settings page re-renders from resolved state rather than
      // recomputing the default-vs-override rule itself.
      return {
        preferences: await context.services.notification.getPreferences(userId),
      };
    },
  }),
);

/** Drop an override, restoring the topic default. */
builder.mutationField('clearNotificationPreference', (t) =>
  t.fieldWithInputPayload({
    authorize: ['user'],
    input: {
      topicKey: t.input.string({ required: true }),
      channel: t.input.field({ required: true, type: channelEnum }),
    },
    payload: {
      cleared: t.payload.field({ type: 'Boolean' }),
      preferences: t.payload.field({ type: [topicPreferenceType] }),
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
