import { z } from 'zod';

import type {
  DataQuery,
  GetResult,
} from '@src/utils/data-operations/prisma-types.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { Prisma } from '@src/generated/prisma/client.js';
import { prisma } from '@src/services/prisma.js';
import { relationHelpers } from '@src/utils/data-operations/relation-helpers.js';
import { throwIfPrismaNotFound } from '@src/utils/http-errors.js';

import { blogPostPolicy } from '../authorizers/blog-post.policy.js';

const blogPostFieldSchemas = z.object({
  blogId: z.uuid(),
  publisherId: z.uuid(),
  title: z.string(),
  content: z.string(),
  metadata: z
    .json()
    .transform((val) => (val === null ? Prisma.JsonNull : val))
    .optional(),
});

export const blogPostCreateSchema = blogPostFieldSchemas;

export async function createBlogPost<TQuery extends DataQuery<'blogPost'>>({
  data,
  query,
  context,
}: {
  data: z.infer<typeof blogPostCreateSchema>;
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'blogPost', TQuery>> {
  blogPostPolicy.create.checkGlobalRoles(context);
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

export const blogPostUpdateSchema = blogPostFieldSchemas.partial();

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
  const { blogId, publisherId, ...rest } = data;

  const result = await prisma.blogPost
    .update({
      where: blogPostPolicy.update.whereUnique(context, where),
      data: {
        ...rest,
        blog: relationHelpers.connectUpdate({ id: blogId }),
        publisher: relationHelpers.connectUpdate({ id: publisherId }),
      },
      ...query,
    })
    .catch(throwIfPrismaNotFound('BlogPost not found'));

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
  const result = await prisma.blogPost
    .delete({
      where: blogPostPolicy.delete.whereUnique(context, where),
      ...query,
    })
    .catch(throwIfPrismaNotFound('BlogPost not found'));

  return result as GetResult<'blogPost', TQuery>;
}
