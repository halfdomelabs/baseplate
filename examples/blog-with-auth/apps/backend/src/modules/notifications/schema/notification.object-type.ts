import { builder } from '@src/plugins/graphql/builder.js';

export const notificationObjectType = builder.prismaObject('Notification', {
  fields: (t) => ({
    id: t.exposeID('id'),
    type: t.exposeString('type'),
    fallbackText: t.exposeString('fallbackText'),
    entityType: t.exposeString('entityType', { nullable: true }),
    entityId: t.exposeString('entityId', { nullable: true }),
    actionUrl: t.exposeString('actionUrl', { nullable: true }),
    seenAt: t.expose('seenAt', { nullable: true, type: 'DateTime' }),
    readAt: t.expose('readAt', { nullable: true, type: 'DateTime' }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});
