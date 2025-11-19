import { z } from 'zod';

import { $Enums } from '@src/generated/prisma/client.js';
import {
  defineCreateOperation,
  defineDeleteOperation,
  defineUpdateOperation,
} from '@src/utils/data-operations/define-operations.js';
import { scalarField } from '@src/utils/data-operations/field-definitions.js';
import { relationHelpers } from '@src/utils/data-operations/relation-helpers.js';

import { fileField } from '../../storage/services/file-field.js';
import { todoListCoverPhotoFileCategory } from '../constants/file-categories.js';

export const todoListInputFields = {
  ownerId: scalarField(z.string().uuid()),
  position: scalarField(z.number().int()),
  name: scalarField(z.string()),
  createdAt: scalarField(z.date().optional()),
  status: scalarField(z.nativeEnum($Enums.TodoListStatus).nullish()),
  coverPhoto: fileField({
    category: todoListCoverPhotoFileCategory,
    fileIdFieldName: 'coverPhotoId',
    optional: true,
  }),
};

export const createTodoList = defineCreateOperation({
  model: 'todoList',
  fields: todoListInputFields,
  create: ({ tx, data: { ownerId, ...data }, query }) =>
    tx.todoList.create({
      data: { ...data, owner: relationHelpers.connectCreate({ id: ownerId }) },
      ...query,
    }),
});

export const updateTodoList = defineUpdateOperation({
  model: 'todoList',
  fields: todoListInputFields,
  update: ({ tx, where, data: { ownerId, ...data }, query }) =>
    tx.todoList.update({
      where,
      data: { ...data, owner: relationHelpers.connectUpdate({ id: ownerId }) },
      ...query,
    }),
});

export const deleteTodoList = defineDeleteOperation({
  model: 'todoList',
  delete: ({ tx, where, query }) =>
    tx.todoList.delete({
      where,
      ...query,
    }),
});
