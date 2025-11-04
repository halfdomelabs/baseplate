import { z } from 'zod';

import { defineCreateOperation } from '@src/utils/data-operations/define-operations.js';
import { scalarField } from '@src/utils/data-operations/field-definitions.js';
import { relationHelpers } from '@src/utils/data-operations/relation-helpers.js';

export const todoItemInputFields = {
  assigneeId: scalarField(z.string().uuid().nullish()),
  done: scalarField(z.boolean()),
  position: scalarField(z.number().int()),
  text: scalarField(z.string()),
  todoListId: scalarField(z.string().uuid()),
};

export const createTodoItem = defineCreateOperation({
  model: 'todoItem',
  fields: todoItemInputFields,
  buildData: ({ assigneeId, todoListId, ...data }) => ({
    ...data,
    assignee: relationHelpers.connectCreate({ id: assigneeId }),
    todoList: relationHelpers.connectCreate({ id: todoListId }),
  }),
});
