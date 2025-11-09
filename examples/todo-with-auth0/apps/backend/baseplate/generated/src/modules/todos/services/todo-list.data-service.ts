import { pick } from 'es-toolkit';
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
  createdAt: scalarField(z.date()),
  status: scalarField(z.nativeEnum($Enums.TodoListStatus).nullish()),
  coverPhoto: fileField({
    category: todoListCoverPhotoFileCategory,
    fileIdFieldName: 'coverPhotoId',
    optional: true,
  }),
};

export const createTodoList = defineCreateOperation({
  model: 'todoList',
  fields: pick(todoListInputFields, [
    'position',
    'name',
    'ownerId',
    'status',
    'createdAt',
  ]),
  buildData: ({ ownerId, ...data }) => ({
    ...data,
    owner: relationHelpers.connectCreate({ id: ownerId }),
  }),
});

export const updateTodoList = defineUpdateOperation({
  model: 'todoList',
  fields: pick(todoListInputFields, [
    'position',
    'name',
    'ownerId',
    'status',
    'createdAt',
  ]),
  buildData: ({ ownerId, ...data }) => ({
    ...data,
    owner: relationHelpers.connectUpdate({ id: ownerId }),
  }),
});

export const deleteTodoList = defineDeleteOperation({
  model: 'todoList',
});
