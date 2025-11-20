import { queryFromInfo } from '@pothos/plugin-prisma';

import { builder } from '@src/plugins/graphql/builder.js';

import {
  createTodoListShare,
  deleteTodoListShare,
  updateTodoListShare,
} from '../services/todo-list-share.data-service.js';
import {
  todoListShareObjectType,
  todoListSharePrimaryKeyInputType,
} from './todo-list-share.object-type.js';

const createTodoListShareDataInputType = builder
  .inputType('CreateTodoListShareData', {
    fields: (t) => ({
      todoListId: t.field({ required: true, type: 'Uuid' }),
      userId: t.field({ required: true, type: 'Uuid' }),
      updatedAt: t.field({ type: 'DateTime' }),
      createdAt: t.field({ type: 'DateTime' }),
    }),
  })
  .validate(createTodoListShare.$dataSchema);

builder.mutationField('createTodoListShare', (t) =>
  t.fieldWithInputPayload({
    input: {
      data: t.input.field({
        required: true,
        type: createTodoListShareDataInputType,
      }),
    },
    payload: {
      todoListShare: t.payload.field({ type: todoListShareObjectType }),
    },
    authorize: ['user'],
    resolve: async (root, { input: { data } }, context, info) => {
      const todoListShare = await createTodoListShare({
        data,
        context,
        query: queryFromInfo({ context, info, path: ['todoListShare'] }),
      });
      return { todoListShare };
    },
  }),
);

const updateTodoListShareDataInputType = builder
  .inputType('UpdateTodoListShareData', {
    fields: (t) => ({
      todoListId: t.field({ type: 'Uuid' }),
      userId: t.field({ type: 'Uuid' }),
      updatedAt: t.field({ type: 'DateTime' }),
      createdAt: t.field({ type: 'DateTime' }),
    }),
  })
  .validate(updateTodoListShare.$dataSchema);

builder.mutationField('updateTodoListShare', (t) =>
  t.fieldWithInputPayload({
    input: {
      id: t.input.field({
        required: true,
        type: todoListSharePrimaryKeyInputType,
      }),
      data: t.input.field({
        required: true,
        type: updateTodoListShareDataInputType,
      }),
    },
    payload: {
      todoListShare: t.payload.field({ type: todoListShareObjectType }),
    },
    authorize: ['user'],
    resolve: async (root, { input: { id, data } }, context, info) => {
      const todoListShare = await updateTodoListShare({
        where: { todoListId_userId: id },
        data,
        context,
        query: queryFromInfo({ context, info, path: ['todoListShare'] }),
      });
      return { todoListShare };
    },
  }),
);

builder.mutationField('deleteTodoListShare', (t) =>
  t.fieldWithInputPayload({
    input: {
      id: t.input.field({
        required: true,
        type: todoListSharePrimaryKeyInputType,
      }),
    },
    payload: {
      todoListShare: t.payload.field({ type: todoListShareObjectType }),
    },
    authorize: ['user'],
    resolve: async (root, { input: { id } }, context, info) => {
      const todoListShare = await deleteTodoListShare({
        where: { todoListId_userId: id },
        context,
        query: queryFromInfo({ context, info, path: ['todoListShare'] }),
      });
      return { todoListShare };
    },
  }),
);
