import { z } from 'zod';

import { defineCreateOperation } from '@src/utils/data-operations/define-operations.js';
import { scalarField } from '@src/utils/data-operations/field-definitions.js';
import { relationHelpers } from '@src/utils/data-operations/relation-helpers.js';

export const todoListShareInputFields = {
  todoListId: scalarField(z.string().uuid()),
  userId: scalarField(z.string().uuid()),
  updatedAt: scalarField(z.date()),
  createdAt: scalarField(z.date()),
};

export const createTodoListShare = defineCreateOperation({
  model: 'todoListShare',
  fields: todoListShareInputFields,
  buildData: ({ todoListId, userId, ...data }) => ({
    ...data,
    todoList: relationHelpers.connectCreate({ id: todoListId }),
    user: relationHelpers.connectCreate({ id: userId }),
  }),
});
