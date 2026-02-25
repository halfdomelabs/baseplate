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
  TQueryArgs extends ModelQuery<'user'> = ModelQuery<'user'>,
>({
  data: input,
  query,
  context,
}: DataCreateInput<'user', typeof userInputFields, TQueryArgs>): Promise<
  GetPayload<'user', TQueryArgs>
> {
  const plan = await composeCreate({
    model: 'user',
    fields: userInputFields,
    input,
    context,
  });

  return commitCreate(plan, {
    query,
    execute: async ({ tx, data, query }) => {
      const item = await tx.user.create({
        data,
        ...query,
      });
      return item;
    },
  });
}

export const userUpdateSchema = generateUpdateSchema(userInputFields);

export async function updateUser<
  TQueryArgs extends ModelQuery<'user'> = ModelQuery<'user'>,
>({
  where,
  data: input,
  query,
  context,
}: DataUpdateInput<'user', typeof userInputFields, TQueryArgs>): Promise<
  GetPayload<'user', TQueryArgs>
> {
  const plan = await composeUpdate({
    model: 'user',
    fields: userInputFields,
    input,
    context,
    loadExisting: () => prisma.user.findUniqueOrThrow({ where }),
  });

  return commitUpdate(plan, {
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
}

export async function deleteUser<
  TQueryArgs extends ModelQuery<'user'> = ModelQuery<'user'>,
>({
  where,
  query,
  context,
}: DataDeleteInput<'user', TQueryArgs>): Promise<
  GetPayload<'user', TQueryArgs>
> {
  return commitDelete({
    model: 'user',
    where,
    query,
    context,
    execute: async ({ tx, where, query }) => {
      const item = await tx.user.delete({
        where,
        ...query,
      });
      return item;
    },
  });
}
