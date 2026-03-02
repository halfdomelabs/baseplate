import { builder } from '@src/plugins/graphql/builder.js';

export const todoItemObjectType = builder.prismaObject('TodoItem', {
  fields: (t) => ({
    id: t.exposeID('id'),
    todoListId: t.expose('todoListId', { type: 'Uuid' }),
    position: t.exposeInt('position'),
    text: t.exposeString('text'),
    done: t.exposeBoolean('done'),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    attachments: t.relation('attachments'),
    todoList: t.relation('todoList'),
  }),
});
