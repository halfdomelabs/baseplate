import { z } from 'zod';

import type {
  DataQuery,
  GetResult,
} from '@src/utils/data-operations/prisma-types.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';
import { relationHelpers } from '@src/utils/data-operations/relation-helpers.js';
import { throwIfPrismaNotFound } from '@src/utils/http-errors.js';

import { blogPolicy } from '../authorizers/blog.policy.js';

const blogFieldSchemas = z.object({ name: z.string(), userId: z.uuid() });

export const blogUpdateSchema = blogFieldSchemas.partial();

export async function updateBlog<TQuery extends DataQuery<'blog'>>({
  where,
  data,
  query,
  context,
}: {
  where: { id: string };
  data: z.infer<typeof blogUpdateSchema>;
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'blog', TQuery>> {
  const { userId, ...rest } = data;

  const result = await prisma.blog
    .update({
      where: blogPolicy.update.whereUnique(context, where),
      data: { ...rest, user: relationHelpers.connectUpdate({ id: userId }) },
      ...query,
    })
    .catch(throwIfPrismaNotFound('Blog not found'));

  return result as GetResult<'blog', TQuery>;
}

export async function deleteBlog<TQuery extends DataQuery<'blog'>>({
  where,
  query,
  context,
}: {
  where: { id: string };
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'blog', TQuery>> {
  const result = await prisma.blog
    .delete({
      where: blogPolicy.delete.whereUnique(context, where),
      ...query,
    })
    .catch(throwIfPrismaNotFound('Blog not found'));

  return result as GetResult<'blog', TQuery>;
}
