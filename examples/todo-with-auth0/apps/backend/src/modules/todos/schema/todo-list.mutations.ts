import { queryFromInfo } from '@pothos/plugin-prisma';

import { builder } from '@src/plugins/graphql/builder.js';

import { fileInputInputType } from '../../storage/schema/file-input.input-type.js';
import {
  createTodoList,
  deleteTodoList,
  updateTodoList,
} from '../services/todo-list.data-service.js';
import { todoListStatusEnum } from './enums.js';
import { todoListObjectType } from './todo-list.object-type.js';

const createTodoListDataInputType = builder
  .inputType('CreateTodoListData', {
    fields: (t) => ({
      ownerId: t.field({ required: true, type: 'Uuid' }),
      position: t.int({ required: true }),
      name: t.string({ required: true }),
      createdAt: t.field({ type: 'DateTime' }),
      status: t.field({ type: todoListStatusEnum }),
      coverPhoto: t.field({ type: fileInputInputType }),
    }),
  })
  .validate(createTodoList.$dataSchema);

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
        data,
        context,
        query: queryFromInfo({ context, info, path: ['todoList'] }),
        skipValidation: true,
      });
      return { todoList };
    },
  }),
);

const updateTodoListDataInputType = builder
  .inputType('UpdateTodoListData', {
    fields: (t) => ({
      ownerId: t.field({ type: 'Uuid' }),
      position: t.int(),
      name: t.string(),
      createdAt: t.field({ type: 'DateTime' }),
      status: t.field({ type: todoListStatusEnum }),
      coverPhoto: t.field({ type: fileInputInputType }),
    }),
  })
  .validate(updateTodoList.$dataSchema);

builder.mutationField('updateTodoList', (t) =>
  t.fieldWithInputPayload({
    input: {
      id: t.input.field({ required: true, type: 'Uuid' }),
      data: t.input.field({
        required: true,
        type: updateTodoListDataInputType,
      }),
    },
    payload: { todoList: t.payload.field({ type: todoListObjectType }) },
    authorize: ['user'],
    resolve: async (root, { input: { id, data } }, context, info) => {
      const todoList = await updateTodoList({
        where: { id },
        data,
        context,
        query: queryFromInfo({ context, info, path: ['todoList'] }),
        skipValidation: true,
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
        where: { id },
        context,
        query: queryFromInfo({ context, info, path: ['todoList'] }),
      });
      return { todoList };
    },
  }),
);
