import { queryFromInfo } from '@pothos/plugin-prisma';

import { builder } from '@src/plugins/graphql/builder.js';
import { restrictObjectNulls } from '@src/utils/nulls.js';

import { fileInputInputType } from '../../storage/schema/file-input.input-type.js';
import {
  createTodoList,
  deleteTodoList,
  updateTodoList,
} from '../services/todo-list.crud.js';
import { todoListStatusEnum } from './enums.js';
import { todoListObjectType } from './todo-list.object-type.js';

const todoListCreateDataInputType = builder.inputType('TodoListCreateData', {
  fields: (t) => ({
    position: t.int({ required: true }),
    name: t.string({ required: true }),
    ownerId: t.field({ required: true, type: 'Uuid' }),
    status: t.field({ type: todoListStatusEnum }),
    createdAt: t.field({ type: 'DateTime' }),
    coverPhoto: t.field({ type: fileInputInputType }),
  }),
});

builder.mutationField('createTodoList', (t) =>
  t.fieldWithInputPayload({
    input: {
      data: t.input.field({
        required: true,
        type: todoListCreateDataInputType,
      }),
    },
    payload: { todoList: t.payload.field({ type: todoListObjectType }) },
    authorize: ['user'],
    resolve: async (root, { input: { data } }, context, info) => {
      const todoList = await createTodoList({
        data: restrictObjectNulls(data, ['createdAt']),
        context,
        query: queryFromInfo({ context, info, path: ['todoList'] }),
      });
      return { todoList };
    },
  }),
);

const todoListUpdateDataInputType = builder.inputType('TodoListUpdateData', {
  fields: (t) => ({
    position: t.int(),
    name: t.string(),
    ownerId: t.field({ type: 'Uuid' }),
    status: t.field({ type: todoListStatusEnum }),
    createdAt: t.field({ type: 'DateTime' }),
    coverPhoto: t.field({ type: fileInputInputType }),
  }),
});

builder.mutationField('updateTodoList', (t) =>
  t.fieldWithInputPayload({
    input: {
      id: t.input.field({ required: true, type: 'Uuid' }),
      data: t.input.field({
        required: true,
        type: todoListUpdateDataInputType,
      }),
    },
    payload: { todoList: t.payload.field({ type: todoListObjectType }) },
    authorize: ['user'],
    resolve: async (root, { input: { id, data } }, context, info) => {
      const todoList = await updateTodoList({
        id,
        data: restrictObjectNulls(data, [
          'position',
          'name',
          'ownerId',
          'createdAt',
        ]),
        context,
        query: queryFromInfo({ context, info, path: ['todoList'] }),
      });
      return { todoList };
    },
  }),
);

builder.mutationField('deleteTodoList', (t) =>
  t.fieldWithInputPayload({
    input: { id: t.input.field({ required: true, type: 'Uuid' }) },
    payload: { todoList: t.payload.field({ type: todoListObjectType }) },
    authorize: ['user'],
    resolve: async (root, { input: { id } }, context, info) => {
      const todoList = await deleteTodoList({
        id,
        context,
        query: queryFromInfo({ context, info, path: ['todoList'] }),
      });
      return { todoList };
    },
  }),
);
