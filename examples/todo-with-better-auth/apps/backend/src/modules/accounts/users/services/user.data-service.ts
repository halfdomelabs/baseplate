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
  fileInputSchema,
  fileTransformer,
} from '../../../storage/services/file-transformer.js';
import {
  userImageFileFileCategory,
  userProfileAvatarFileCategory,
} from '../constants/file-categories.js';

const customerInputSchema = z.object({
  stripeCustomerId: z.string(),
});

const userImageInputSchema = z.object({
  id: z.uuid().optional(),
  caption: z.string(),
  file: fileInputSchema,
});

const userRoleInputSchema = z.object({
  role: z.string(),
});

const userProfileInputSchema = z.object({
  bio: z.string().nullish(),
  birthDay: z.date().nullish(),
  favoriteTodoListId: z.uuid().nullish(),
  avatar: fileInputSchema.nullish(),
});

const userTransformers = {
  userImageFile: fileTransformer({ category: userImageFileFileCategory }),
  userProfileAvatar: fileTransformer({
    category: userProfileAvatarFileCategory,
    optional: true,
  }),

  customer: oneToOneTransformer({
    parentModel: 'user',
    model: 'customer',
    schema: customerInputSchema,

    processCreate: (input) => async (tx, parent) => {
      await tx.customer.create({
        data: {
          stripeCustomerId: input.stripeCustomerId,
          user: { connect: { id: parent.id } },
        },
      });
    },

    processUpdate: (input, existing) => async (tx) => {
      await tx.customer.update({
        where: { id: existing.id },
        data: { stripeCustomerId: input.stripeCustomerId },
      });
    },

    processDelete: () => async (tx, parent) => {
      await tx.customer.deleteMany({ where: { id: parent.id } });
    },
  }),

  images: oneToManyTransformer({
    parentModel: 'user',
    model: 'userImage',
    schema: userImageInputSchema,
    compareItem: (input, existing) => input.id === existing.id,

    processCreate: async (itemInput, ctx) => {
      const { file, ...rest } = itemInput;
      const plan = await prepareTransformers({
        transformers: {
          file: userTransformers.userImageFile.forCreate(file),
        },
        serviceContext: ctx.serviceContext,
      });

      return async (tx, parent) => {
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
      };
    },

    processUpdate: async (itemInput, existingItem, ctx) => {
      const plan = await prepareTransformers({
        transformers: {
          file: userTransformers.userImageFile.forUpdate(
            itemInput.file,
            existingItem.fileId,
          ),
        },
        serviceContext: ctx.serviceContext,
      });

      return async (tx) => {
        await executeTransformPlan(plan, {
          tx,
          execute: async ({ transformed }) =>
            tx.userImage.update({
              where: { id: existingItem.id },
              data: {
                caption: itemInput.caption,
                ...transformed,
              },
            }),
        });
      };
    },

    deleteRemoved: async (tx, removedItems) => {
      await tx.userImage.deleteMany({
        where: { OR: removedItems.map((i) => ({ id: i.id })) },
      });
    },
  }),

  roles: oneToManyTransformer({
    parentModel: 'user',
    model: 'userRole',
    schema: userRoleInputSchema,

    processCreate: (itemInput) => async (tx, parent) => {
      await tx.userRole.create({
        data: {
          role: itemInput.role,
          user: { connect: { id: parent.id } },
        },
      });
    },

    deleteRemoved: async (tx, removedItems) => {
      await tx.userRole.deleteMany({
        where: {
          OR: removedItems.map((i) => ({
            userId: i.userId,
            role: i.role,
          })),
        },
      });
    },
  }),

  userProfile: oneToOneTransformer({
    parentModel: 'user',
    model: 'userProfile',
    schema: userProfileInputSchema,

    processCreate: async (input, ctx) => {
      const { avatar, favoriteTodoListId, ...rest } = input;

      const plan = await prepareTransformers({
        transformers: {
          avatar: userTransformers.userProfileAvatar.forCreate(avatar),
        },
        serviceContext: ctx.serviceContext,
      });

      return async (tx, parent) => {
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
      };
    },

    processUpdate: async (input, existing, ctx) => {
      const { avatar, favoriteTodoListId, ...rest } = input;

      const plan = await prepareTransformers({
        transformers: {
          avatar: userTransformers.userProfileAvatar.forUpdate(
            avatar,
            existing.avatarId,
          ),
        },
        serviceContext: ctx.serviceContext,
      });

      return async (tx) => {
        await executeTransformPlan(plan, {
          tx,
          execute: async ({ transformed }) =>
            tx.userProfile.update({
              where: { id: existing.id },
              data: {
                ...rest,
                ...transformed,
                favoriteTodoList: relationHelpers.connectUpdate({
                  id: favoriteTodoListId,
                }),
              },
            }),
        });
      };
    },

    processDelete: () => async (tx, parent) => {
      await tx.userProfile.deleteMany({ where: { userId: parent.id } });
    },
  }),
};

export const userCreateSchema = z.object({
  name: z.string(),
  email: z.string(),
  customer: customerInputSchema.nullish(),
  images: z.array(userImageInputSchema).optional(),
  roles: z.array(userRoleInputSchema).optional(),
  userProfile: userProfileInputSchema.nullish(),
});

export const userUpdateSchema = userCreateSchema.partial();

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
  const { name, email, customer, images, roles, userProfile } = input;

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
    execute: async ({ tx }) => tx.user.create({ data: { name, email } }),
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
          prisma.userProfile.findUnique({
            where: { userId: where.id },
          }),
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
