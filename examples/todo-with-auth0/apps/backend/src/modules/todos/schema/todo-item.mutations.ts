import { queryFromInfo } from '@pothos/plugin-prisma';

import { builder } from '@src/plugins/graphql/builder.js';
import { restrictObjectNulls } from '@src/utils/nulls.js';

import {
  createTodoItem,
  deleteTodoItem,
  updateTodoItem,
} from '../services/todo-item.crud.js';
import { todoItemObjectType } from './todo-item.object-type.js';

const todoItemAttachmentEmbeddedTagsDataInputType = builder.inputType(
  'TodoItemAttachmentEmbeddedTagsData',
  {
    fields: (t) => ({ tag: t.string({ required: true }) }),
  },
);

const todoItemEmbeddedAttachmentsDataInputType = builder.inputType(
  'TodoItemEmbeddedAttachmentsData',
  {
    fields: (t) => ({
      position: t.int({ required: true }),
      url: t.string({ required: true }),
      id: t.field({ type: 'Uuid' }),
      tags: t.field({ type: [todoItemAttachmentEmbeddedTagsDataInputType] }),
    }),
  },
);

const todoItemCreateDataInputType = builder.inputType('TodoItemCreateData', {
  fields: (t) => ({
    todoListId: t.field({ required: true, type: 'Uuid' }),
    position: t.int({ required: true }),
    text: t.string({ required: true }),
    done: t.boolean({ required: true }),
    assigneeId: t.field({ type: 'Uuid' }),
    attachments: t.field({ type: [todoItemEmbeddedAttachmentsDataInputType] }),
  }),
});

builder.mutationField('createTodoItem', (t) =>
  t.fieldWithInputPayload({
    input: {
      data: t.input.field({
        required: true,
        type: todoItemCreateDataInputType,
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

const todoItemUpdateDataInputType = builder.inputType('TodoItemUpdateData', {
  fields: (t) => ({
    position: t.int(),
    text: t.string(),
    done: t.boolean(),
    assigneeId: t.field({ type: 'Uuid' }),
    todoListId: t.field({ type: 'Uuid' }),
    attachments: t.field({ type: [todoItemEmbeddedAttachmentsDataInputType] }),
  }),
});

builder.mutationField('updateTodoItem', (t) =>
  t.fieldWithInputPayload({
    input: {
      id: t.input.field({ required: true, type: 'Uuid' }),
      data: t.input.field({
        required: true,
        type: todoItemUpdateDataInputType,
      }),
    },
    payload: { todoItem: t.payload.field({ type: todoItemObjectType }) },
    authorize: ['user'],
    resolve: async (root, { input: { id, data } }, context, info) => {
      const todoItem = await updateTodoItem({
        id,
        data: restrictObjectNulls(
          {
            ...data,
            attachments: data.attachments?.map((attachment) =>
              restrictObjectNulls(attachment, ['id', 'tags']),
            ),
          },
          ['position', 'text', 'done', 'todoListId', 'attachments'],
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
        id,
        context,
        query: queryFromInfo({ context, info, path: ['todoItem'] }),
      });
      return { todoItem };
    },
  }),
);
