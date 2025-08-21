import { builder } from '@src/plugins/graphql/builder.js';

export const todoItemAttachmentObjectType = builder.prismaObject(
  'TodoItemAttachment',
  {
    fields: (t) => ({
      id: t.exposeID('id'),
      todoItemId: t.expose('todoItemId', { type: 'Uuid' }),
      position: t.exposeInt('position'),
      url: t.exposeString('url'),
      updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
      createdAt: t.expose('createdAt', { type: 'DateTime' }),
      tags: t.relation('tags'),
      todoItem: t.relation('todoItem'),
    }),
  },
);
