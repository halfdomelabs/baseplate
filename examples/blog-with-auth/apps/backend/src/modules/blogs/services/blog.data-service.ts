import { z } from 'zod';

import type {
  DataQuery,
  GetResult,
} from '@src/utils/data-operations/prisma-types.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';
import { checkInstanceAuthorization } from '@src/utils/authorizers.js';
import { relationHelpers } from '@src/utils/data-operations/relation-helpers.js';

import { blogAuthorizer } from '../authorizers/blog.authorizer.js';

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
  const existingItem = await prisma.blog.findUniqueOrThrow({ where });
  await checkInstanceAuthorization(context, existingItem, [
    'admin',
    blogAuthorizer.roles.owner,
  ]);
  const { userId, ...rest } = data;

  const result = await prisma.blog.update({
    where,
    data: { ...rest, user: relationHelpers.connectUpdate({ id: userId }) },
    ...query,
  });

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
  const existingItem = await prisma.blog.findUniqueOrThrow({ where });
  await checkInstanceAuthorization(context, existingItem, [
    'admin',
    blogAuthorizer.roles.owner,
  ]);

  const result = await prisma.blog.delete({
    where,
    ...query,
  });

  return result as GetResult<'blog', TQuery>;
}
