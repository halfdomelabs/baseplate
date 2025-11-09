import { queryFromInfo } from '@pothos/plugin-prisma';

import { builder } from '@src/plugins/graphql/builder.js';
import { restrictObjectNulls } from '@src/utils/nulls.js';

import { fileInputInputType } from '../../storage/schema/file-input.input-type.js';
import {
  createTodoList,
  deleteTodoList,
  updateTodoList,
} from '../services/todo-list.data-service.js';
import { todoListStatusEnum } from './enums.js';
import { todoListObjectType } from './todo-list.object-type.js';

const createTodoListDataInputType = builder.inputType('CreateTodoListData', {
  fields: (t) => ({
    ownerId: t.field({ required: true, type: 'Uuid' }),
    position: t.int({ required: true }),
    name: t.string({ required: true }),
    createdAt: t.field({ type: 'DateTime' }),
    status: t.field({ type: todoListStatusEnum }),
    coverPhoto: t.field({ type: fileInputInputType }),
  }),
});

builder.mutationField('createTodoList', (t) =>
  t.fieldWithInputPayload({
    input: {
      data: t.input.field({
        required: true,
        type: createTodoListDataInputType,
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

const updateTodoListDataInputType = builder.inputType('UpdateTodoListData', {
  fields: (t) => ({
    ownerId: t.field({ type: 'Uuid' }),
    position: t.int(),
    name: t.string(),
    createdAt: t.field({ type: 'DateTime' }),
    status: t.field({ type: todoListStatusEnum }),
    coverPhoto: t.field({ type: fileInputInputType }),
  }),
});

builder.mutationField('updateTodoList', (t) =>
  t.fieldWithInputPayload({
    input: {
      where: t.input.field({ required: true, type: 'Uuid' }),
      data: t.input.field({
        required: true,
        type: updateTodoListDataInputType,
      }),
    },
    payload: { todoList: t.payload.field({ type: todoListObjectType }) },
    authorize: ['user'],
    resolve: async (root, { input: { where, data } }, context, info) => {
      const todoList = await updateTodoList({
        where,
        data: restrictObjectNulls(data, [
          'ownerId',
          'position',
          'name',
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
    input: { where: t.input.field({ required: true, type: 'Uuid' }) },
    payload: { todoList: t.payload.field({ type: todoListObjectType }) },
    authorize: ['user'],
    resolve: async (root, { input: { where } }, context, info) => {
      const todoList = await deleteTodoList({
        where,
        context,
        query: queryFromInfo({ context, info, path: ['todoList'] }),
      });
      return { todoList };
    },
  }),
);
