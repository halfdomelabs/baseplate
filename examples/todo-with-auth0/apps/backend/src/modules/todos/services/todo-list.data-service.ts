import { z } from 'zod';

import { $Enums } from '@src/generated/prisma/client.js';
import { defineCreateOperation } from '@src/utils/data-operations/define-operations.js';
import { scalarField } from '@src/utils/data-operations/field-definitions.js';
import { relationHelpers } from '@src/utils/data-operations/relation-helpers.js';

export const todoListInputFields = {
  createdAt: scalarField(z.date()),
  name: scalarField(z.string()),
  ownerId: scalarField(z.string().uuid()),
  position: scalarField(z.number().int()),
  status: scalarField(z.nativeEnum($Enums.TodoListStatus).nullish()),
};

export const createTodoList = defineCreateOperation({
  model: 'todoList',
  fields: todoListInputFields,
  buildData: ({ ownerId, ...data }) => ({
    ...data,
    owner: relationHelpers.connectCreate({ id: ownerId }),
  }),
});
