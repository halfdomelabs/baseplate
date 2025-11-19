import { queryFromInfo } from '@pothos/plugin-prisma';

import { builder } from '@src/plugins/graphql/builder.js';
import { restrictObjectNulls } from '@src/utils/nulls.js';

import {
  createTodoItem,
  deleteTodoItem,
  updateTodoItem,
} from '../services/todo-item.data-service.js';
import { todoItemObjectType } from './todo-item.object-type.js';

const todoItemAttachmentTagsNestedInputInputType = builder.inputType(
  'TodoItemAttachmentTagsNestedInput',
  {
    fields: (t) => ({ tag: t.string({ required: true }) }),
  },
);

const todoItemAttachmentsNestedInputInputType = builder.inputType(
  'TodoItemAttachmentsNestedInput',
  {
    fields: (t) => ({
      position: t.int({ required: true }),
      url: t.string({ required: true }),
      id: t.id(),
      tags: t.field({ type: [todoItemAttachmentTagsNestedInputInputType] }),
    }),
  },
);

const createTodoItemDataInputType = builder.inputType('CreateTodoItemData', {
  fields: (t) => ({
    todoListId: t.field({ required: true, type: 'Uuid' }),
    position: t.int({ required: true }),
    text: t.string({ required: true }),
    done: t.boolean({ required: true }),
    assigneeId: t.field({ type: 'Uuid' }),
    attachments: t.field({ type: [todoItemAttachmentsNestedInputInputType] }),
  }),
});

builder.mutationField('createTodoItem', (t) =>
  t.fieldWithInputPayload({
    input: {
      data: t.input.field({
        required: true,
        type: createTodoItemDataInputType,
      }),
    },
    payload: { todoItem: t.payload.field({ type: todoItemObjectType }) },
    authorize: ['user'],
    resolve: async (root, { input: { data } }, context, info) => {
      const todoItem = await createTodoItem({
        data: restrictObjectNulls(
          {
            ...data,
            attachments: data.attachments?.map((attachment) =>
              restrictObjectNulls(attachment, ['id', 'tags']),
            ),
          },
          ['attachments'],
        ),
        context,
        query: queryFromInfo({ context, info, path: ['todoItem'] }),
      });
      return { todoItem };
    },
  }),
);

const updateTodoItemDataInputType = builder.inputType('UpdateTodoItemData', {
  fields: (t) => ({
    todoListId: t.field({ type: 'Uuid' }),
    position: t.int(),
    text: t.string(),
    done: t.boolean(),
    assigneeId: t.field({ type: 'Uuid' }),
    attachments: t.field({ type: [todoItemAttachmentsNestedInputInputType] }),
  }),
});

builder.mutationField('updateTodoItem', (t) =>
  t.fieldWithInputPayload({
    input: {
      id: t.input.field({ required: true, type: 'Uuid' }),
      data: t.input.field({
        required: true,
        type: updateTodoItemDataInputType,
      }),
    },
    payload: { todoItem: t.payload.field({ type: todoItemObjectType }) },
    authorize: ['user'],
    resolve: async (root, { input: { id, data } }, context, info) => {
      const todoItem = await updateTodoItem({
        where: { id },
        data: restrictObjectNulls(
          {
            ...data,
            attachments: data.attachments?.map((attachment) =>
              restrictObjectNulls(attachment, ['id', 'tags']),
            ),
          },
          ['todoListId', 'position', 'text', 'done', 'attachments'],
        ),
        context,
        query: queryFromInfo({ context, info, path: ['todoItem'] }),
      });
      return { todoItem };
    },
  }),
);

builder.mutationField('deleteTodoItem', (t) =>
  t.fieldWithInputPayload({
    input: { id: t.input.field({ required: true, type: 'Uuid' }) },
    payload: { todoItem: t.payload.field({ type: todoItemObjectType }) },
    authorize: ['user'],
    resolve: async (root, { input: { id } }, context, info) => {
      const todoItem = await deleteTodoItem({
        where: { id },
        context,
        query: queryFromInfo({ context, info, path: ['todoItem'] }),
      });
      return { todoItem };
    },
  }),
);
