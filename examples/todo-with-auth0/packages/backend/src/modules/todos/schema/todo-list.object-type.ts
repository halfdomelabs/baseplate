import { builder } from '@src/plugins/graphql/builder.js';

import { todoListStatusEnum } from './enums.js';

export const todoListObjectType = builder.prismaObject('TodoList', {
  fields: (t) => ({
    id: t.exposeID('id'),
    ownerId: t.expose('ownerId', { type: 'Uuid' }),
    position: t.exposeInt('position'),
    name: t.exposeString('name'),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    status: t.expose('status', { nullable: true, type: todoListStatusEnum }),
    coverPhoto: t.relation('coverPhoto', { nullable: true }),
    owner: t.relation('owner'),
  }),
});
