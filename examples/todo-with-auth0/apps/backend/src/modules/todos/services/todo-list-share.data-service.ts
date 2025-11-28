import { z } from 'zod';

import {
  defineCreateOperation,
  defineDeleteOperation,
  defineUpdateOperation,
} from '@src/utils/data-operations/define-operations.js';
import { scalarField } from '@src/utils/data-operations/field-definitions.js';
import { relationHelpers } from '@src/utils/data-operations/relation-helpers.js';

export const todoListShareInputFields = {
  todoListId: scalarField(z.uuid()),
  userId: scalarField(z.uuid()),
  updatedAt: scalarField(z.date().optional()),
  createdAt: scalarField(z.date().optional()),
};

export const createTodoListShare = defineCreateOperation({
  model: 'todoListShare',
  fields: todoListShareInputFields,
  create: ({ tx, data: { todoListId, userId, ...data }, query }) =>
    tx.todoListShare.create({
      data: {
        ...data,
        todoList: relationHelpers.connectCreate({ id: todoListId }),
        user: relationHelpers.connectCreate({ id: userId }),
      },
      ...query,
    }),
});

export const updateTodoListShare = defineUpdateOperation({
  model: 'todoListShare',
  fields: todoListShareInputFields,
  update: ({ tx, where, data: { todoListId, userId, ...data }, query }) =>
    tx.todoListShare.update({
      where,
      data: {
        ...data,
        todoList: relationHelpers.connectUpdate({ id: todoListId }),
        user: relationHelpers.connectUpdate({ id: userId }),
      },
      ...query,
    }),
});

export const deleteTodoListShare = defineDeleteOperation({
  model: 'todoListShare',
  delete: ({ tx, where, query }) =>
    tx.todoListShare.delete({
      where,
      ...query,
    }),
});
