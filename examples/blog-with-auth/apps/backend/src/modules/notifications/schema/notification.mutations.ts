import { builder } from '@src/plugins/graphql/builder.js';
import { prisma } from '@src/services/prisma.js';

import {
  deleteNotification,
  markAllAsRead,
  markAllAsSeen,
  markAsRead,
} from '../services/notification.service.js';
import { notificationObjectType } from './notification.object-type.js';

/**
 * Mark a notification read (and therefore seen). Returns the updated notification
 * and the new unseen count so Apollo can normalize without a refetch; `changed`
 * is false when the id didn't exist or was already read.
 */
builder.mutationField('markNotificationRead', (t) =>
  t.fieldWithInputPayload({
    authorize: ['user'],
    input: { id: t.input.field({ required: true, type: 'Uuid' }) },
    payload: {
      changed: t.payload.field({ type: 'Boolean' }),
      notification: t.payload.field({
        type: /* TPL_NOTIFICATION_OBJECT_TYPE:START */ notificationObjectType /* TPL_NOTIFICATION_OBJECT_TYPE:END */,
        nullable: true,
      }),
      unseenCount: t.payload.field({ type: 'Int' }),
    },
    resolve: async (_root, { input }, context) => {
      const userId = context.auth.userIdOrThrow();
      const { changed, unseenCount } = await markAsRead(userId, input.id);
      const notification = await prisma.notification.findFirst({
        where: { id: input.id, recipientId: userId },
      });
      return { changed, notification, unseenCount };
    },
  }),
);

/** Mark all of the current user's notifications seen (opening the bell badge). */
builder.mutationField('markAllNotificationsSeen', (t) =>
  t.fieldWithInputPayload({
    authorize: ['user'],
    payload: {
      changedCount: t.payload.field({ type: 'Int' }),
      unseenCount: t.payload.field({ type: 'Int' }),
    },
    resolve: async (_root, _args, context) =>
      markAllAsSeen(context.auth.userIdOrThrow()),
  }),
);

/** Mark all of the current user's notifications read (and therefore seen). */
builder.mutationField('markAllNotificationsRead', (t) =>
  t.fieldWithInputPayload({
    authorize: ['user'],
    payload: {
      changedCount: t.payload.field({ type: 'Int' }),
      unseenCount: t.payload.field({ type: 'Int' }),
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
      unseenCount: t.payload.field({ type: 'Int' }),
    },
    resolve: async (_root, { input }, context) => {
      const { changed, unseenCount } = await deleteNotification(
        context.auth.userIdOrThrow(),
        input.id,
      );
      return { deletedId: changed ? input.id : null, unseenCount };
    },
  }),
);
