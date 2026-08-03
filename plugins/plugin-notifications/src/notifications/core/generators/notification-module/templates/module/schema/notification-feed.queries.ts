// @ts-nocheck

import type { Prisma } from '%prismaGeneratedImports';

import { builder } from '%pothosImports';
import { prisma } from '%prismaImports';

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
 * Sorted by `id`, not `createdAt`: `id` is a uuidv7, so it is already
 * time-ordered, and it is unique — which `createdAt` is not, since its
 * millisecond precision ties under fast inserts and `now()` is frozen across a
 * transaction. One unique sort key keeps cursor paging total.
 */
builder.queryField('notificationFeed', (t) =>
  t.prismaConnection(
    {
      type: 'Notification',
      cursor: 'id',
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
          orderBy: { id: 'desc' },
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
