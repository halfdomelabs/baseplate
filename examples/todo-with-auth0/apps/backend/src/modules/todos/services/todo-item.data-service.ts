import { pick } from 'es-toolkit';
import { z } from 'zod';

import { defineCreateOperation } from '@src/utils/data-operations/define-operations.js';
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
  todoListId: scalarField(z.string().uuid()),
  position: scalarField(z.number().int()),
  text: scalarField(z.string()),
  done: scalarField(z.boolean()),
  assigneeId: scalarField(z.string().uuid().nullish()),
  attachments: nestedOneToManyField({
    buildData: (data) => data,
    fields: pick(todoItemAttachmentInputFields, ['position', 'url', 'id']),
    getWhereUnique: (input) => ({ id: input.id }),
    model: 'todoItemAttachment',
    parentModel,
    relationName: 'todoItem',
  }),
};

export const createTodoItem = defineCreateOperation({
  model: 'todoItem',
  fields: pick(todoItemInputFields, [
    'todoListId',
    'position',
    'text',
    'done',
    'assigneeId',
  ]),
  buildData: ({ assigneeId, todoListId, ...data }) => ({
    ...data,
    assignee: relationHelpers.connectCreate({ id: assigneeId }),
    todoList: relationHelpers.connectCreate({ id: todoListId }),
  }),
});
