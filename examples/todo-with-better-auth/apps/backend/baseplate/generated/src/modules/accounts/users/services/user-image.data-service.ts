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
import { userImageFileFileCategory } from '../constants/file-categories.js';

export const userImageFieldSchemas = z.object({
  id: z.uuid().optional(),
  caption: z.string(),
  file: fileInputSchema,
});

export const userImageTransformers = {
  file: fileTransformer({ category: userImageFileFileCategory }),
};

export async function deleteUserImage<TQuery extends DataQuery<'userImage'>>({
  where,
  query,
}: {
  where: { id: string };
  query?: TQuery;
}): Promise<GetResult<'userImage', TQuery>> {
  const result = await prisma.userImage.delete({
    where,
    ...query,
  });

  return result as GetResult<'userImage', TQuery>;
}
