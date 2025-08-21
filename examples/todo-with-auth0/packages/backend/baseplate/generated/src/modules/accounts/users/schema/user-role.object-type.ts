import { builder } from '@src/plugins/graphql/builder.js';

export const userRoleObjectType = builder.prismaObject('UserRole', {
  fields: (t) => ({
    userId: t.expose('userId', { type: 'Uuid' }),
    role: t.exposeString('role'),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    user: t.relation('user'),
  }),
});
