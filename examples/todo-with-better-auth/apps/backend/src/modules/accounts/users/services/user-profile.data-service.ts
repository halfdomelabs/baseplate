import { z } from 'zod';

import type {
  DataQuery,
  GetResult,
} from '@src/utils/data-operations/prisma-types.js';

import { prisma } from '@src/services/prisma.js';

import {
  fileInputSchema,
  fileTransformer,
} from '../../../storage/services/file-transformer.js';
import { userProfileAvatarFileCategory } from '../constants/file-categories.js';

export const userProfileFieldSchemas = {
  id: z.uuid().optional(),
  bio: z.string().nullish(),
  birthDay: z.date().nullish(),
  favoriteTodoListId: z.uuid().nullish(),
  avatar: fileInputSchema.nullish(),
};

export const userProfileTransformers = {
  avatar: fileTransformer({
    category: userProfileAvatarFileCategory,
    optional: true,
  }),
};

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
