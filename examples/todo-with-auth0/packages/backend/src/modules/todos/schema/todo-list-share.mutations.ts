import { queryFromInfo } from '@pothos/plugin-prisma';

import { builder } from '@src/plugins/graphql/builder.js';
import { restrictObjectNulls } from '@src/utils/nulls.js';

import {
  createTodoListShare,
  deleteTodoListShare,
  updateTodoListShare,
} from '../services/todo-list-share.crud.js';
import {
  todoListShareObjectType,
  todoListSharePrimaryKeyInputType,
} from './todo-list-share.object-type.js';

const todoListShareCreateDataInputType = builder.inputType(
  'TodoListShareCreateData',
  {
    fields: (t) => ({
      todoListId: t.field({ required: true, type: 'Uuid' }),
      userId: t.field({ required: true, type: 'Uuid' }),
      updatedAt: t.field({ type: 'DateTime' }),
      createdAt: t.field({ type: 'DateTime' }),
    }),
  },
);

builder.mutationField('createTodoListShare', (t) =>
  t.fieldWithInputPayload({
    input: {
      data: t.input.field({
        required: true,
        type: todoListShareCreateDataInputType,
      }),
    },
    payload: {
      todoListShare: t.payload.field({ type: todoListShareObjectType }),
    },
    authorize: ['user'],
    resolve: async (root, { input: { data } }, context, info) => {
      const todoListShare = await createTodoListShare({
        data: restrictObjectNulls(data, ['updatedAt', 'createdAt']),
        context,
        query: queryFromInfo({ context, info, path: ['todoListShare'] }),
      });
      return { todoListShare };
    },
  }),
);

const todoListShareUpdateDataInputType = builder.inputType(
  'TodoListShareUpdateData',
  {
    fields: (t) => ({
      todoListId: t.field({ type: 'Uuid' }),
      userId: t.field({ type: 'Uuid' }),
      updatedAt: t.field({ type: 'DateTime' }),
      createdAt: t.field({ type: 'DateTime' }),
    }),
  },
);

builder.mutationField('updateTodoListShare', (t) =>
  t.fieldWithInputPayload({
    input: {
      id: t.input.field({
        required: true,
        type: todoListSharePrimaryKeyInputType,
      }),
      data: t.input.field({
        required: true,
        type: todoListShareUpdateDataInputType,
      }),
    },
    payload: {
      todoListShare: t.payload.field({ type: todoListShareObjectType }),
    },
    authorize: ['user'],
    resolve: async (root, { input: { id, data } }, context, info) => {
      const todoListShare = await updateTodoListShare({
        id,
        data: restrictObjectNulls(data, [
          'todoListId',
          'userId',
          'updatedAt',
          'createdAt',
        ]),
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
        id,
        context,
        query: queryFromInfo({ context, info, path: ['todoListShare'] }),
      });
      return { todoListShare };
    },
  }),
);
