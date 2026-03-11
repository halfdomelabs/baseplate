import { z } from 'zod';

import type {
  GetPayload,
  ModelInclude,
} from '@src/utils/data-operations/prisma-types.js';
import type {
  DataCreateInput,
  DataDeleteInput,
  DataUpdateInput,
} from '@src/utils/data-operations/types.js';

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

export const todoListShareInputFields = {
  todoListId: scalarField(z.uuid()),
  userId: scalarField(z.uuid()),
  updatedAt: scalarField(z.date().optional()),
  createdAt: scalarField(z.date().optional()),
};

export const todoListShareCreateSchema = generateCreateSchema(
  todoListShareInputFields,
);

export async function createTodoListShare<
  TIncludeArgs extends ModelInclude<'todoListShare'> =
    ModelInclude<'todoListShare'>,
>({
  data: input,
  query,
  context,
}: DataCreateInput<
  'todoListShare',
  typeof todoListShareInputFields,
  TIncludeArgs
>): Promise<GetPayload<'todoListShare', TIncludeArgs>> {
  const plan = await composeCreate({
    model: 'todoListShare',
    fields: todoListShareInputFields,
    input,
    context,
    authorize: ['user'],
  });

  const item = await commitCreate(plan, {
    query,
    execute: async ({ tx, data: { todoListId, userId, ...rest }, query }) => {
      const item = await tx.todoListShare.create({
        data: {
          ...rest,
          todoList: relationHelpers.connectCreate({ id: todoListId }),
          user: relationHelpers.connectCreate({ id: userId }),
        },
        ...query,
      });
      return item;
    },
  });

  return item;
}

export const todoListShareUpdateSchema = generateUpdateSchema(
  todoListShareInputFields,
);

export async function updateTodoListShare<
  TIncludeArgs extends ModelInclude<'todoListShare'> =
    ModelInclude<'todoListShare'>,
>({
  where,
  data: input,
  query,
  context,
}: DataUpdateInput<
  'todoListShare',
  typeof todoListShareInputFields,
  TIncludeArgs
>): Promise<GetPayload<'todoListShare', TIncludeArgs>> {
  const plan = await composeUpdate({
    model: 'todoListShare',
    fields: todoListShareInputFields,
    input,
    context,
    loadExisting: () => prisma.todoListShare.findUniqueOrThrow({ where }),
    authorize: ['user'],
  });

  const item = await commitUpdate(plan, {
    query,
    execute: async ({ tx, data: { todoListId, userId, ...rest }, query }) => {
      const item = await tx.todoListShare.update({
        where,
        data: {
          ...rest,
          todoList: relationHelpers.connectUpdate({ id: todoListId }),
          user: relationHelpers.connectUpdate({ id: userId }),
        },
        ...query,
      });
      return item;
    },
  });

  return item;
}

export async function deleteTodoListShare<
  TIncludeArgs extends ModelInclude<'todoListShare'> =
    ModelInclude<'todoListShare'>,
>({
  where,
  query,
  context,
}: DataDeleteInput<'todoListShare', TIncludeArgs>): Promise<
  GetPayload<'todoListShare', TIncludeArgs>
> {
  const item = await commitDelete({
    model: 'todoListShare',
    query,
    context,
    execute: async ({ tx, query }) => {
      const item = await tx.todoListShare.delete({
        where,
        ...query,
      });
      return item;
    },
    authorize: ['user'],
  });

  return item;
}
