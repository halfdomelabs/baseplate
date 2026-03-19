import { z } from 'zod';

import type {
  DataQuery,
  GetResult,
} from '@src/utils/data-operations/prisma-types.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { Prisma } from '@src/generated/prisma/client.js';
import { prisma } from '@src/services/prisma.js';
import { checkGlobalAuthorization } from '@src/utils/authorizers.js';
import { relationHelpers } from '@src/utils/data-operations/relation-helpers.js';

const blogPostFieldSchemas = {
  blogId: z.uuid(),
  publisherId: z.uuid(),
  title: z.string(),
  content: z.string(),
  metadata: z
    .json()
    .transform((val) => (val === null ? Prisma.JsonNull : val))
    .optional(),
};

export const blogPostCreateSchema = z.object(blogPostFieldSchemas);

export const blogPostUpdateSchema = z.object(blogPostFieldSchemas).partial();

export async function createBlogPost<TQuery extends DataQuery<'blogPost'>>({
  data,
  query,
  context,
}: {
  data: z.infer<typeof blogPostCreateSchema>;
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'blogPost', TQuery>> {
  checkGlobalAuthorization(context, ['admin']);
  const { blogId, publisherId, ...rest } = data;

  const result = await prisma.blogPost.create({
    data: {
      ...rest,
      blog: relationHelpers.connectCreate({ id: blogId }),
      publisher: relationHelpers.connectCreate({ id: publisherId }),
    },
    ...query,
  });

  return result as GetResult<'blogPost', TQuery>;
}

export async function updateBlogPost<TQuery extends DataQuery<'blogPost'>>({
  where,
  data,
  query,
  context,
}: {
  where: { id: string };
  data: z.infer<typeof blogPostUpdateSchema>;
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'blogPost', TQuery>> {
  checkGlobalAuthorization(context, ['admin']);
  const { blogId, publisherId, ...rest } = data;

  const result = await prisma.blogPost.update({
    where,
    data: {
      ...rest,
      blog: relationHelpers.connectUpdate({ id: blogId }),
      publisher: relationHelpers.connectUpdate({ id: publisherId }),
    },
    ...query,
  });

  return result as GetResult<'blogPost', TQuery>;
}

export async function deleteBlogPost<TQuery extends DataQuery<'blogPost'>>({
  where,
  query,
  context,
}: {
  where: { id: string };
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'blogPost', TQuery>> {
  checkGlobalAuthorization(context, ['admin']);

  const result = await prisma.blogPost.delete({
    where,
    ...query,
  });

  return result as GetResult<'blogPost', TQuery>;
}
