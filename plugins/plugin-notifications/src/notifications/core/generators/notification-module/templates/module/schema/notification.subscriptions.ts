// @ts-nocheck

import { builder } from '%pothosImports';
import { prisma } from '%prismaImports';
import { getPubSub } from '%yogaPluginImports';

/** Real-time: a new notification was created for the current user. */
builder.subscriptionField('notificationReceived', (t) =>
  t.prismaField({
    type: 'Notification',
    authorize: ['user'],
    subscribe: (_root, _args, context) =>
      getPubSub().subscribe(
        'notificationReceived',
        context.auth.userIdOrThrow(),
      ),
    // Re-scope to the recipient rather than trusting the topic payload: the
    // topic is already per-user, but this fails closed if a future publisher
    // ever puts another user's notification id on the topic.
    resolve: (query, payload, _args, context) =>
      prisma.notification.findFirstOrThrow({
        ...query,
        where: {
          id: payload.notificationId,
          recipientId: context.auth.userIdOrThrow(),
        },
      }),
  }),
);

/** Real-time: the current user's unread count changed (the bell badge). */
builder.subscriptionField('unreadCountChanged', (t) =>
  t.int({
    authorize: ['user'],
    subscribe: (_root, _args, context) =>
      getPubSub().subscribe('unreadCountChanged', context.auth.userIdOrThrow()),
    resolve: (payload) => payload.count,
  }),
);
