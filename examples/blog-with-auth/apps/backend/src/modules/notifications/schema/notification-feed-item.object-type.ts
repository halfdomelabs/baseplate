import { builder } from '@src/plugins/graphql/builder.js';

export const notificationFeedItemObjectType = builder.prismaObject(
  'NotificationFeedItem',
  {
    fields: (t) => ({
      id: t.exposeID('id'),
      type: t.exposeString('type'),
      entityType: t.exposeString('entityType', { nullable: true }),
      entityId: t.exposeString('entityId', { nullable: true }),
      seenAt: t.expose('seenAt', { nullable: true, type: 'DateTime' }),
      readAt: t.expose('readAt', { nullable: true, type: 'DateTime' }),
      createdAt: t.expose('createdAt', { type: 'DateTime' }),
      actor: t.relation('actor', { nullable: true }),
    }),
  },
);
