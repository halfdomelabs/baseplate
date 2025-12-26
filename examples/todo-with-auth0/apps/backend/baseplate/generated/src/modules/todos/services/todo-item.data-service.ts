import { pick } from 'es-toolkit';
import { z } from 'zod';

import {
  defineCreateOperation,
  defineDeleteOperation,
  defineUpdateOperation,
} from '@src/utils/data-operations/define-operations.js';
import {
  createParentModelConfig,
  nestedOneToManyField,
  scalarField,
} from '@src/utils/data-operations/field-definitions.js';
import { relationHelpers } from '@src/utils/data-operations/relation-helpers.js';

import { todoItemAttachmentInputFields } from './todo-item-attachment.data-service.js';

const parentModel = createParentModelConfig('todoItem', (value) => ({
  id: value.id,
}));

export const todoItemInputFields = {
  todoListId: scalarField(z.uuid()),
  position: scalarField(z.int()),
  text: scalarField(z.string()),
  done: scalarField(z.boolean()),
  assigneeId: scalarField(z.uuid().nullish()),
  attachments: nestedOneToManyField({
    buildData: (data) => data,
    fields: pick(todoItemAttachmentInputFields, [
      'position',
      'url',
      'id',
      'tags',
    ] as const),
    getWhereUnique: (input) => (input.id ? { id: input.id } : undefined),
    model: 'todoItemAttachment',
    parentModel,
    relationName: 'todoItem',
  }),
};

export const createTodoItem = defineCreateOperation({
  model: 'todoItem',
  fields: todoItemInputFields,
  create: async ({ tx, data: { assigneeId, todoListId, ...data }, query }) => {
    const item = await tx.todoItem.create({
      data: {
        ...data,
        assignee: relationHelpers.connectCreate({ id: assigneeId }),
        todoList: relationHelpers.connectCreate({ id: todoListId }),
      },
      ...query,
    });
    return item;
  },
});

export const updateTodoItem = defineUpdateOperation({
  model: 'todoItem',
  fields: todoItemInputFields,
  update: async ({
    tx,
    where,
    data: { assigneeId, todoListId, ...data },
    query,
  }) => {
    const item = await tx.todoItem.update({
      where,
      data: {
        ...data,
        assignee: relationHelpers.connectUpdate({ id: assigneeId }),
        todoList: relationHelpers.connectUpdate({ id: todoListId }),
      },
      ...query,
    });
    return item;
  },
});

export const deleteTodoItem = defineDeleteOperation({
  model: 'todoItem',
  delete: async ({ tx, where, query }) => {
    const item = await tx.todoItem.delete({
      where,
      ...query,
    });
    return item;
  },
});
