import { z } from 'zod';

import type {
  GetPayload,
  ModelQuery,
} from '@src/utils/data-operations/prisma-types.js';
import type {
  DataCreateInput,
  DataDeleteInput,
  DataUpdateInput,
} from '@src/utils/data-operations/types.js';

import { $Enums } from '@src/generated/prisma/client.js';
import { prisma } from '@src/services/prisma.js';
import {
  commitCreate,
  commitDelete,
  commitUpdate,
} from '@src/utils/data-operations/commit-operations.js';
import {
  composeCreate,
  composeUpdate,
} from '@src/utils/data-operations/compose-operations.js';
import { scalarField } from '@src/utils/data-operations/field-definitions.js';
import {
  generateCreateSchema,
  generateUpdateSchema,
} from '@src/utils/data-operations/field-utils.js';
import { relationHelpers } from '@src/utils/data-operations/relation-helpers.js';

import { fileField } from '../../storage/services/file-field.js';
import { todoListCoverPhotoFileCategory } from '../constants/file-categories.js';

export const todoListInputFields = {
  ownerId: scalarField(z.uuid()),
  position: scalarField(z.int()),
  name: scalarField(z.string()),
  createdAt: scalarField(z.date().optional()),
  status: scalarField(z.enum($Enums.TodoListStatus).nullish()),
  coverPhoto: fileField({
    category: todoListCoverPhotoFileCategory,
    fileIdFieldName: 'coverPhotoId',
    optional: true,
  }),
};

export const todoListCreateSchema = generateCreateSchema(todoListInputFields);

export async function createTodoList<
  TQueryArgs extends ModelQuery<'todoList'> = ModelQuery<'todoList'>,
>({
  data: input,
  query,
  context,
}: DataCreateInput<
  'todoList',
  typeof todoListInputFields,
  TQueryArgs
>): Promise<GetPayload<'todoList', TQueryArgs>> {
  const plan = await composeCreate({
    model: 'todoList',
    fields: todoListInputFields,
    input,
    context,
  });

  return commitCreate(plan, {
    query,
    execute: async ({ tx, data: { ownerId, ...rest }, query }) => {
      const item = await tx.todoList.create({
        data: {
          ...rest,
          owner: relationHelpers.connectCreate({ id: ownerId }),
        },
        ...query,
      });
      return item;
    },
  });
}

export const todoListUpdateSchema = generateUpdateSchema(todoListInputFields);

export async function updateTodoList<
  TQueryArgs extends ModelQuery<'todoList'> = ModelQuery<'todoList'>,
>({
  where,
  data: input,
  query,
  context,
}: DataUpdateInput<
  'todoList',
  typeof todoListInputFields,
  TQueryArgs
>): Promise<GetPayload<'todoList', TQueryArgs>> {
  const plan = await composeUpdate({
    model: 'todoList',
    fields: todoListInputFields,
    input,
    context,
    loadExisting: () => prisma.todoList.findUniqueOrThrow({ where }),
  });

  return commitUpdate(plan, {
    query,
    execute: async ({ tx, data: { ownerId, ...rest }, query }) => {
      const item = await tx.todoList.update({
        where,
        data: {
          ...rest,
          owner: relationHelpers.connectUpdate({ id: ownerId }),
        },
        ...query,
      });
      return item;
    },
  });
}

export async function deleteTodoList<
  TQueryArgs extends ModelQuery<'todoList'> = ModelQuery<'todoList'>,
>({
  where,
  query,
  context,
}: DataDeleteInput<'todoList', TQueryArgs>): Promise<
  GetPayload<'todoList', TQueryArgs>
> {
  return commitDelete({
    model: 'todoList',
    where,
    query,
    context,
    execute: async ({ tx, where, query }) => {
      const item = await tx.todoList.delete({
        where,
        ...query,
      });
      return item;
    },
  });
}
