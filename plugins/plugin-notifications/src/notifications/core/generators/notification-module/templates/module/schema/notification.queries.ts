// @ts-nocheck

import { getUnreadCount } from '$servicesNotificationService';
import { builder } from '%pothosImports';
import { prisma } from '%prismaImports';
import { z } from 'zod';

/** Upper bound on the feed page size (each row does per-row render work). */
const MAX_PAGE_SIZE = 100;

/** Paginated feed of the current user's notifications (newest first). */
builder.queryField('notifications', (t) =>
  t.prismaField({
    type: ['Notification'],
    authorize: ['user'],
    args: {
      skip: t.arg.int({ validate: z.int().min(0) }),
      take: t.arg.int({ validate: z.int().min(0).max(MAX_PAGE_SIZE) }),
    },
    resolve: (query, _root, { skip, take }, context) =>
      prisma.notification.findMany({
        ...query,
        where: { recipientId: context.auth.userIdOrThrow() },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: skip ?? undefined,
        take: take ?? 20,
      }),
  }),
);

/** Count of the current user's unread notifications (the bell badge). */
builder.queryField('unreadNotificationCount', (t) =>
  t.int({
    authorize: ['user'],
    resolve: (_root, _args, context) =>
      getUnreadCount(context.auth.userIdOrThrow()),
  }),
);
