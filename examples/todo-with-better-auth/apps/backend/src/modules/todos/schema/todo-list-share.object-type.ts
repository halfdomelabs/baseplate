import { builder } from '@src/plugins/graphql/builder.js';

export const todoListSharePrimaryKeyInputType = builder.inputType(
  'TodoListSharePrimaryKey',
  {
    fields: (t) => ({
      todoListId: t.field({ required: true, type: 'Uuid' }),
      userId: t.field({ required: true, type: 'Uuid' }),
    }),
  },
);

export const todoListShareObjectType = builder.prismaObject('TodoListShare', {
  fields: (t) => ({
    todoListId: t.expose('todoListId', { type: 'Uuid' }),
    userId: t.expose('userId', { type: 'Uuid' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    todoList: t.relation('todoList'),
    user: t.relation('user'),
  }),
});
