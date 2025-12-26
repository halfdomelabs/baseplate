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
  create: async ({ tx, data: { todoListId, userId, ...data }, query }) => {
    const item = await tx.todoListShare.create({
      data: {
        ...data,
        todoList: relationHelpers.connectCreate({ id: todoListId }),
        user: relationHelpers.connectCreate({ id: userId }),
      },
      ...query,
    });
    return item;
  },
});

export const updateTodoListShare = defineUpdateOperation({
  model: 'todoListShare',
  fields: todoListShareInputFields,
  update: async ({
    tx,
    where,
    data: { todoListId, userId, ...data },
    query,
  }) => {
    const item = await tx.todoListShare.update({
      where,
      data: {
        ...data,
        todoList: relationHelpers.connectUpdate({ id: todoListId }),
        user: relationHelpers.connectUpdate({ id: userId }),
      },
      ...query,
    });
    return item;
  },
});

export const deleteTodoListShare = defineDeleteOperation({
  model: 'todoListShare',
  delete: async ({ tx, where, query }) => {
    const item = await tx.todoListShare.delete({
      where,
      ...query,
    });
    return item;
  },
});
