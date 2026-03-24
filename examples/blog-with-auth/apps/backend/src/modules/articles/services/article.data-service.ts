import { z } from 'zod';

import type {
  DataQuery,
  GetResult,
} from '@src/utils/data-operations/prisma-types.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';
import { checkGlobalAuthorization } from '@src/utils/authorizers.js';

const articleFieldSchemas = z.object({
  title: z.string(),
  content: z.string(),
});

export const articleCreateSchema = articleFieldSchemas;

export const articleUpdateSchema = articleFieldSchemas.partial();

export async function createArticle<TQuery extends DataQuery<'article'>>({
  data,
  query,
  context,
}: {
  data: z.infer<typeof articleCreateSchema>;
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'article', TQuery>> {
  checkGlobalAuthorization(context, ['admin']);

  const result = await prisma.article.create({
    data,
    ...query,
  });

  return result as GetResult<'article', TQuery>;
}

export async function updateArticle<TQuery extends DataQuery<'article'>>({
  where,
  data,
  query,
  context,
}: {
  where: { id: string };
  data: z.infer<typeof articleUpdateSchema>;
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'article', TQuery>> {
  checkGlobalAuthorization(context, ['admin']);

  const result = await prisma.article.update({
    where,
    data,
    ...query,
  });

  return result as GetResult<'article', TQuery>;
}
