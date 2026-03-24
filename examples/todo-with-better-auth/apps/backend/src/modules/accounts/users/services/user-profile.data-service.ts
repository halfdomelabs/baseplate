import { z } from 'zod';

import type {
  DataQuery,
  GetResult,
} from '@src/utils/data-operations/prisma-types.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';
import { executeTransformPlan } from '@src/utils/data-operations/execute-transform-plan.js';
import { prepareTransformers } from '@src/utils/data-operations/prepare-transformers.js';
import { relationHelpers } from '@src/utils/data-operations/relation-helpers.js';

import {
  fileInputSchema,
  fileTransformer,
} from '../../../storage/services/file-transformer.js';
import { userProfileAvatarFileCategory } from '../constants/file-categories.js';

export const userProfileFieldSchemas = z.object({
  id: z.uuid().optional(),
  userId: z.uuid(),
  bio: z.string().nullish(),
  birthDay: z.date().nullish(),
  favoriteTodoListId: z.uuid().nullish(),
  avatar: fileInputSchema.nullish(),
});

export const userProfileTransformers = {
  avatar: fileTransformer({
    category: userProfileAvatarFileCategory,
    optional: true,
  }),
};

export const userProfileCreateSchema = userProfileFieldSchemas.pick({
  userId: true,
  bio: true,
});

export async function createUserProfile<
  TQuery extends DataQuery<'userProfile'>,
>({
  data,
  query,
}: {
  data: z.infer<typeof userProfileCreateSchema>;
  query?: TQuery;
}): Promise<GetResult<'userProfile', TQuery>> {
  const { userId, ...rest } = data;

  const result = await prisma.userProfile.create({
    data: { ...rest, user: relationHelpers.connectCreate({ id: userId }) },
    ...query,
  });

  return result as GetResult<'userProfile', TQuery>;
}

export const userProfileUpdateSchema = userProfileFieldSchemas
  .pick({ bio: true, avatar: true })
  .partial();

export async function updateUserProfile<
  TQuery extends DataQuery<'userProfile'>,
>({
  where,
  data,
  query,
  context,
}: {
  where: { id: string };
  data: z.infer<typeof userProfileUpdateSchema>;
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'userProfile', TQuery>> {
  const existingItem = await prisma.userProfile.findUniqueOrThrow({ where });

  const { avatar, ...rest } = data;

  const plan = await prepareTransformers({
    transformers: {
      avatar: userProfileTransformers.avatar.forUpdate(
        avatar,
        existingItem.avatarId,
      ),
    },
    serviceContext: context,
  });

  const result = await executeTransformPlan(plan, {
    execute: async ({ tx, transformed }) =>
      tx.userProfile.update({
        where,
        data: { ...rest, ...transformed },
      }),
    refetch: (item) =>
      prisma.userProfile.findUniqueOrThrow({
        where: { id: item.id },
        ...query,
      }),
  });

  return result as GetResult<'userProfile', TQuery>;
}

export async function deleteUserProfile<
  TQuery extends DataQuery<'userProfile'>,
>({
  where,
  query,
}: {
  where: { id: string };
  query?: TQuery;
}): Promise<GetResult<'userProfile', TQuery>> {
  const result = await prisma.userProfile.delete({
    where,
    ...query,
  });

  return result as GetResult<'userProfile', TQuery>;
}
