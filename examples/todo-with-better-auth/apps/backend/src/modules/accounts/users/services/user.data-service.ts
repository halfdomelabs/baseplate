import { omit } from 'es-toolkit';
import { z } from 'zod';

import type {
  DataQuery,
  GetResult,
} from '@src/utils/data-operations/prisma-types.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';
import { checkGlobalAuthorization } from '@src/utils/authorizers.js';
import { executeTransformPlan } from '@src/utils/data-operations/execute-transform-plan.js';
import {
  oneToManyTransformer,
  oneToOneTransformer,
} from '@src/utils/data-operations/nested-transformers.js';
import { prepareTransformers } from '@src/utils/data-operations/prepare-transformers.js';
import { relationHelpers } from '@src/utils/data-operations/relation-helpers.js';

import {
  userImageFieldSchemas,
  userImageTransformers,
} from './user-image.data-service.js';
import {
  userProfileFieldSchemas,
  userProfileTransformers,
} from './user-profile.data-service.js';

const userFieldSchemas = {
  name: z.string(),
  email: z.string(),
  customer: z.object({ stripeCustomerId: z.string() }).nullish(),
  images: z.array(z.object(userImageFieldSchemas)).optional(),
  roles: z.array(z.object({ role: z.string() })).optional(),
  userProfile: z.object(userProfileFieldSchemas).nullish(),
};

export const userCreateSchema = z.object(userFieldSchemas);

export const userUpdateSchema = z.object(userFieldSchemas).partial();

export const userTransformers = {
  customer: oneToOneTransformer({
    model: 'customer',
    parentModel: 'user',
    processCreate: (itemInput) => async (tx, parent) => {
      await tx.customer.create({
        data: { ...itemInput, user: { connect: { id: parent.id } } },
      });
    },
    processDelete: () => async (tx, parent) => {
      await tx.customer.deleteMany({ where: { id: parent.id } });
    },
    processUpdate: (itemInput, existingItem) => async (tx) => {
      await tx.customer.update({
        where: { id: existingItem.id },
        data: itemInput,
      });
    },
    schema: z.object({ stripeCustomerId: z.string() }),
  }),
  images: oneToManyTransformer({
    compareItem: (input, existing) => input.id === existing.id,
    deleteRemoved: async (tx, removedItems) => {
      await tx.userImage.deleteMany({
        where: { OR: removedItems.map((i) => ({ id: i.id })) },
      });
    },
    model: 'userImage',
    parentModel: 'user',
    processCreate:
      (itemInput, { serviceContext }) =>
      async (tx, parent) => {
        const { file, ...rest } = itemInput;

        const plan = await prepareTransformers({
          transformers: { file: userImageTransformers.file.forCreate(file) },
          serviceContext,
        });

        await executeTransformPlan(plan, {
          tx,
          execute: async ({ transformed }) =>
            tx.userImage.create({
              data: {
                ...rest,
                ...transformed,
                user: { connect: { id: parent.id } },
              },
            }),
        });
      },
    processUpdate:
      (itemInput, existingItem, { serviceContext }) =>
      async (tx) => {
        const { file, ...rest } = itemInput;

        const plan = await prepareTransformers({
          transformers: {
            file: userImageTransformers.file.forUpdate(
              file,
              existingItem.fileId,
            ),
          },
          serviceContext,
        });

        await executeTransformPlan(plan, {
          tx,
          execute: async ({ transformed }) =>
            tx.userImage.update({
              where: { id: existingItem.id },
              data: { ...omit(rest, ['id']), ...transformed },
            }),
        });
      },
    schema: z.object(userImageFieldSchemas),
  }),
  roles: oneToManyTransformer({
    compareItem: (input, existing) => input.role === existing.role,
    deleteRemoved: async (tx, removedItems) => {
      await tx.userRole.deleteMany({
        where: {
          OR: removedItems.map((i) => ({ userId: i.userId, role: i.role })),
        },
      });
    },
    model: 'userRole',
    parentModel: 'user',
    processCreate: (itemInput) => async (tx, parent) => {
      await tx.userRole.create({
        data: { ...itemInput, user: { connect: { id: parent.id } } },
      });
    },
    processUpdate: (itemInput, existingItem) => async (tx) => {
      await tx.userRole.update({
        where: {
          userId_role: { userId: existingItem.userId, role: existingItem.role },
        },
        data: omit(itemInput, ['role']),
      });
    },
    schema: z.object({ role: z.string() }),
  }),
  userProfile: oneToOneTransformer({
    model: 'userProfile',
    parentModel: 'user',
    processCreate:
      (itemInput, { serviceContext }) =>
      async (tx, parent) => {
        const { avatar, favoriteTodoListId, ...rest } = itemInput;

        const plan = await prepareTransformers({
          transformers: {
            avatar: userProfileTransformers.avatar.forCreate(avatar),
          },
          serviceContext,
        });

        await executeTransformPlan(plan, {
          tx,
          execute: async ({ transformed }) =>
            tx.userProfile.create({
              data: {
                ...rest,
                ...transformed,
                favoriteTodoList: relationHelpers.connectCreate({
                  id: favoriteTodoListId,
                }),
                user: { connect: { id: parent.id } },
              },
            }),
        });
      },
    processDelete: () => async (tx, parent) => {
      await tx.userProfile.deleteMany({ where: { userId: parent.id } });
    },
    processUpdate:
      (itemInput, existingItem, { serviceContext }) =>
      async (tx) => {
        const { avatar, favoriteTodoListId, ...rest } = itemInput;

        const plan = await prepareTransformers({
          transformers: {
            avatar: userProfileTransformers.avatar.forUpdate(
              avatar,
              existingItem.avatarId,
            ),
          },
          serviceContext,
        });

        await executeTransformPlan(plan, {
          tx,
          execute: async ({ transformed }) =>
            tx.userProfile.update({
              where: { id: existingItem.id },
              data: {
                ...omit(rest, ['id']),
                ...transformed,
                favoriteTodoList: relationHelpers.connectUpdate({
                  id: favoriteTodoListId,
                }),
              },
            }),
        });
      },
    schema: z.object(userProfileFieldSchemas),
  }),
};

export async function createUser<TQuery extends DataQuery<'user'>>({
  data: input,
  query,
  context,
}: {
  data: z.infer<typeof userCreateSchema>;
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'user', TQuery>> {
  checkGlobalAuthorization(context, ['admin']);
  const { customer, images, roles, userProfile, ...rest } = input;

  const plan = await prepareTransformers({
    transformers: {
      customer: userTransformers.customer.forCreate(customer),
      images: userTransformers.images.forCreate(images),
      roles: userTransformers.roles.forCreate(roles),
      userProfile: userTransformers.userProfile.forCreate(userProfile),
    },
    serviceContext: context,
  });

  const result = await executeTransformPlan(plan, {
    execute: async ({ tx, transformed }) =>
      tx.user.create({
        data: { ...rest, ...transformed },
      }),
    refetch: (item) =>
      prisma.user.findUniqueOrThrow({ where: { id: item.id }, ...query }),
  });

  return result as GetResult<'user', TQuery>;
}

export async function updateUser<TQuery extends DataQuery<'user'>>({
  where,
  data: input,
  query,
  context,
}: {
  where: { id: string };
  data: z.infer<typeof userUpdateSchema>;
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'user', TQuery>> {
  checkGlobalAuthorization(context, ['admin']);
  const { customer, images, roles, userProfile, ...rest } = input;

  const plan = await prepareTransformers({
    transformers: {
      customer: userTransformers.customer.forUpdate(customer, {
        loadExisting: () =>
          prisma.customer.findUnique({ where: { id: where.id } }),
      }),
      images: userTransformers.images.forUpdate(images, {
        loadExisting: () =>
          prisma.userImage.findMany({ where: { userId: where.id } }),
      }),
      roles: userTransformers.roles.forUpdate(roles, {
        loadExisting: () =>
          prisma.userRole.findMany({ where: { userId: where.id } }),
      }),
      userProfile: userTransformers.userProfile.forUpdate(userProfile, {
        loadExisting: () =>
          prisma.userProfile.findUnique({ where: { userId: where.id } }),
      }),
    },
    serviceContext: context,
  });

  const result = await executeTransformPlan(plan, {
    execute: async ({ tx, transformed }) =>
      tx.user.update({
        where,
        data: { ...rest, ...transformed },
      }),
    refetch: (item) =>
      prisma.user.findUniqueOrThrow({ where: { id: item.id }, ...query }),
  });

  return result as GetResult<'user', TQuery>;
}

export async function deleteUser<TQuery extends DataQuery<'user'>>({
  where,
  query,
  context,
}: {
  where: { id: string };
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'user', TQuery>> {
  checkGlobalAuthorization(context, ['admin']);

  const result = await prisma.user.delete({
    where,
    ...query,
  });

  return result as GetResult<'user', TQuery>;
}
