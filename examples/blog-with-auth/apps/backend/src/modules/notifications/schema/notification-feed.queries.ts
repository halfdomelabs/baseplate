import type { Prisma } from '@src/generated/prisma/client.js';

import { builder } from '@src/plugins/graphql/builder.js';
import { prisma } from '@src/services/prisma.js';

/** Upper bound on the feed page size (each row does per-row render work). */
const MAX_PAGE_SIZE = 100;

/** Page size when the caller supplies neither `first` nor `last`. */
const DEFAULT_PAGE_SIZE = 20;

/**
 * What the feed shows: this user's in-app rows that are still present. Rows
 * exist for every channel, so `inApp` is what separates a feed entry from an
 * email-only one.
 */
function feedFilter(recipientId: string): Prisma.NotificationWhereInput {
  return { recipientId, inApp: true, dismissedAt: null };
}

/**
 * The current user's notification feed, newest first, scoped to the session.
 *
 * Sorted by `feedSortKey`, a uuidv7 reissued whenever a collapsing row's state
 * really changes, so a replaced row resurfaces.
 */
builder.queryField('notificationFeed', (t) =>
  t.prismaConnection(
    {
      type: 'Notification',
      cursor: 'feedSortKey',
      maxSize: MAX_PAGE_SIZE,
      defaultSize: DEFAULT_PAGE_SIZE,
      authorize: ['user'],
      totalCount: (_root, _args, context) =>
        prisma.notification.count({
          where: feedFilter(context.auth.userIdOrThrow()),
        }),
      resolve: (query, _root, _args, context) =>
        prisma.notification.findMany({
          ...query,
          where: feedFilter(context.auth.userIdOrThrow()),
          orderBy: { feedSortKey: 'desc' },
        }),
    },
    { name: 'NotificationFeedConnection' },
    { name: 'NotificationFeedEdge' },
  ),
);

/** Count of the current user's unseen notifications (the bell badge). */
builder.queryField('unseenNotificationCount', (t) =>
  t.int({
    authorize: ['user'],
    resolve: (_root, _args, context) =>
      context.services.notification.getUnseenCount(
        context.auth.userIdOrThrow(),
      ),
  }),
);

/** Count of the current user's unread notifications (the panel header). */
builder.queryField('unreadNotificationCount', (t) =>
  t.int({
    authorize: ['user'],
    resolve: (_root, _args, context) =>
      context.services.notification.getUnreadCount(
        context.auth.userIdOrThrow(),
      ),
  }),
);
