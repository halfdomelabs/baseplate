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

export const userInputFields = {
  email: scalarField(z.string().nullish()),
  name: scalarField(z.string().nullish()),
  emailVerified: scalarField(z.boolean().optional()),
};

export const userCreateSchema = generateCreateSchema(userInputFields);

export async function createUser<
  TIncludeArgs extends ModelInclude<'user'> = ModelInclude<'user'>,
>({
  data: input,
  query,
  context,
}: DataCreateInput<'user', typeof userInputFields, TIncludeArgs>): Promise<
  GetPayload<'user', TIncludeArgs>
> {
  const plan = await composeCreate({
    model: 'user',
    fields: userInputFields,
    input,
    context,
    authorize: ['admin'],
  });

  const item = await commitCreate(plan, {
    query,
    execute: async ({ tx, data, query }) => {
      const item = await tx.user.create({
        data,
        ...query,
      });
      return item;
    },
  });

  return item;
}

export const userUpdateSchema = generateUpdateSchema(userInputFields);

export async function updateUser<
  TIncludeArgs extends ModelInclude<'user'> = ModelInclude<'user'>,
>({
  where,
  data: input,
  query,
  context,
}: DataUpdateInput<'user', typeof userInputFields, TIncludeArgs>): Promise<
  GetPayload<'user', TIncludeArgs>
> {
  const plan = await composeUpdate({
    model: 'user',
    fields: userInputFields,
    input,
    context,
    loadExisting: () => prisma.user.findUniqueOrThrow({ where }),
    authorize: ['admin'],
  });

  const item = await commitUpdate(plan, {
    query,
    execute: async ({ tx, data, query }) => {
      const item = await tx.user.update({
        where,
        data,
        ...query,
      });
      return item;
    },
  });

  return item;
}

export async function deleteUser<
  TIncludeArgs extends ModelInclude<'user'> = ModelInclude<'user'>,
>({
  where,
  query,
  context,
}: DataDeleteInput<'user', TIncludeArgs>): Promise<
  GetPayload<'user', TIncludeArgs>
> {
  const item = await commitDelete({
    model: 'user',
    query,
    context,
    execute: async ({ tx, query }) => {
      const item = await tx.user.delete({
        where,
        ...query,
      });
      return item;
    },
    authorize: ['admin'],
  });

  return item;
}
