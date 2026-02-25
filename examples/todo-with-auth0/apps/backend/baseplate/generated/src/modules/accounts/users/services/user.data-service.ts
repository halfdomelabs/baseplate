import { pick } from 'es-toolkit';
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
import {
  createParentModelConfig,
  nestedOneToManyField,
  nestedOneToOneField,
  scalarField,
} from '@src/utils/data-operations/field-definitions.js';
import {
  generateCreateSchema,
  generateUpdateSchema,
} from '@src/utils/data-operations/field-utils.js';
import { relationHelpers } from '@src/utils/data-operations/relation-helpers.js';

import { userImageInputFields } from './user-image.data-service.js';
import { userProfileInputFields } from './user-profile.data-service.js';

const parentModel = createParentModelConfig('user', (value) => ({
  id: value.id,
}));

export const userInputFields = {
  name: scalarField(z.string().nullish()),
  email: scalarField(z.string()),
  customer: nestedOneToOneField({
    buildCreateData: (data) => data,
    buildUpdateData: (data) => data,
    fields: { stripeCustomerId: scalarField(z.string()) },
    getWhereUnique: (parentModel) => ({ id: parentModel.id }),
    model: 'customer',
    parentModel,
    relationName: 'user',
  }),
  images: nestedOneToManyField({
    buildCreateData: (data) => data,
    buildUpdateData: (data) => data,
    fields: pick(userImageInputFields, ['id', 'caption', 'file'] as const),
    getWhereUnique: (input) => (input.id ? { id: input.id } : undefined),
    model: 'userImage',
    parentModel,
    relationName: 'user',
  }),
  roles: nestedOneToManyField({
    buildCreateData: (data) => data,
    buildUpdateData: (data) => data,
    fields: { role: scalarField(z.string()) },
    getWhereUnique: (input, parentModel) =>
      input.role
        ? { userId_role: { role: input.role, userId: parentModel.id } }
        : undefined,
    model: 'userRole',
    parentModel,
    relationName: 'user',
  }),
  userProfile: nestedOneToOneField({
    buildCreateData: ({ favoriteTodoListId, ...data }) => ({
      ...data,
      favoriteTodoList: relationHelpers.connectCreate({
        id: favoriteTodoListId,
      }),
    }),
    buildUpdateData: ({ favoriteTodoListId, ...data }) => ({
      ...data,
      favoriteTodoList: relationHelpers.connectUpdate({
        id: favoriteTodoListId,
      }),
    }),
    fields: pick(userProfileInputFields, [
      'id',
      'bio',
      'birthDay',
      'favoriteTodoListId',
      'avatar',
    ] as const),
    getWhereUnique: (parentModel) => ({ userId: parentModel.id }),
    model: 'userProfile',
    parentModel,
    relationName: 'user',
  }),
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
    query,
    context,
    execute: async ({ tx, query }) => {
      const item = await tx.user.delete({
        where,
        ...query,
      });
      return item;
    },
  });
}
