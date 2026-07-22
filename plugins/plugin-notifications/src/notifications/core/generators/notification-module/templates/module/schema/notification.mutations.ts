// @ts-nocheck

import {
  deleteNotification,
  markAllAsRead,
  markAsRead,
  markAsSeen,
} from '$servicesNotificationService';
import { builder } from '%pothosImports';
import { prisma } from '%prismaImports';

/**
 * Mark a notification read. Returns the updated notification and the new unread
 * count so Apollo can normalize the change without a refetch; `changed` is false
 * when the id didn't exist or was already read (a no-op is not a success).
 */
builder.mutationField('markNotificationRead', (t) =>
  t.fieldWithInputPayload({
    authorize: ['user'],
    input: { id: t.input.field({ required: true, type: 'Uuid' }) },
    payload: {
      changed: t.payload.field({ type: 'Boolean' }),
      notification: t.payload.field({
        type: TPL_NOTIFICATION_OBJECT_TYPE,
        nullable: true,
      }),
      unreadCount: t.payload.field({ type: 'Int' }),
    },
    resolve: async (_root, { input }, context) => {
      const userId = context.auth.userIdOrThrow();
      const { changed, unreadCount } = await markAsRead(userId, input.id);
      const notification = await prisma.notification.findFirst({
        where: { id: input.id, recipientId: userId },
      });
      return { changed, notification, unreadCount };
    },
  }),
);

/** Mark a notification seen (clears the bell badge without opening it). */
builder.mutationField('markNotificationSeen', (t) =>
  t.fieldWithInputPayload({
    authorize: ['user'],
    input: { id: t.input.field({ required: true, type: 'Uuid' }) },
    payload: {
      changed: t.payload.field({ type: 'Boolean' }),
      notification: t.payload.field({
        type: TPL_NOTIFICATION_OBJECT_TYPE,
        nullable: true,
      }),
    },
    resolve: async (_root, { input }, context) => {
      const userId = context.auth.userIdOrThrow();
      const changed = await markAsSeen(userId, input.id);
      const notification = await prisma.notification.findFirst({
        where: { id: input.id, recipientId: userId },
      });
      return { changed, notification };
    },
  }),
);

/** Mark all of the current user's notifications read. */
builder.mutationField('markAllNotificationsRead', (t) =>
  t.fieldWithInputPayload({
    authorize: ['user'],
    payload: {
      changedCount: t.payload.field({ type: 'Int' }),
      unreadCount: t.payload.field({ type: 'Int' }),
    },
    resolve: async (_root, _args, context) =>
      markAllAsRead(context.auth.userIdOrThrow()),
  }),
);

/** Delete a notification. `deletedId` is null when the id didn't exist. */
builder.mutationField('deleteNotification', (t) =>
  t.fieldWithInputPayload({
    authorize: ['user'],
    input: { id: t.input.field({ required: true, type: 'Uuid' }) },
    payload: {
      deletedId: t.payload.field({ type: 'Uuid', nullable: true }),
      unreadCount: t.payload.field({ type: 'Int' }),
    },
    resolve: async (_root, { input }, context) => {
      const { changed, unreadCount } = await deleteNotification(
        context.auth.userIdOrThrow(),
        input.id,
      );
      return { deletedId: changed ? input.id : null, unreadCount };
    },
  }),
);
