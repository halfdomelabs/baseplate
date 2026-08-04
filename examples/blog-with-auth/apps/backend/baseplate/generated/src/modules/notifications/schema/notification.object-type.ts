import { builder } from '@src/plugins/graphql/builder.js';

export const notificationObjectType = builder.prismaObject('Notification', {
  fields: (t) => ({
    id: t.exposeID('id'),
    type: t.exposeString('type'),
    seenAt: t.expose('seenAt', { nullable: true, type: 'DateTime' }),
    readAt: t.expose('readAt', { nullable: true, type: 'DateTime' }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});
