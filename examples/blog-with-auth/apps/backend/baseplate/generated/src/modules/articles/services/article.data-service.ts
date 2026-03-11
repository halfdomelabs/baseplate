import { z } from 'zod';

import type {
  GetPayload,
  ModelInclude,
} from '@src/utils/data-operations/prisma-types.js';
import type {
  DataCreateInput,
  DataUpdateInput,
} from '@src/utils/data-operations/types.js';

import { prisma } from '@src/services/prisma.js';
import {
  commitCreate,
  commitUpdate,
} from '@src/utils/data-operations/commit-operations.js';
import {
  composeCreate,
  composeUpdate,
} from '@src/utils/data-operations/compose-operations.js';
import { scalarField } from '@src/utils/data-operations/field-definitions.js';
import {
  generateCreateSchema,
  generateUpdateSchema,
} from '@src/utils/data-operations/field-utils.js';

export const articleInputFields = {
  title: scalarField(z.string()),
  content: scalarField(z.string()),
};

export const articleCreateSchema = generateCreateSchema(articleInputFields);

export async function createArticle<
  TIncludeArgs extends ModelInclude<'article'> = ModelInclude<'article'>,
>({
  data: input,
  query,
  context,
}: DataCreateInput<
  'article',
  typeof articleInputFields,
  TIncludeArgs
>): Promise<GetPayload<'article', TIncludeArgs>> {
  const plan = await composeCreate({
    model: 'article',
    fields: articleInputFields,
    input,
    context,
    authorize: ['admin'],
  });

  return commitCreate(plan, {
    query,
    execute: async ({ tx, data }) => {
      const item = await tx.article.create({
        data,
      });
      return item;
    },
  });
}

export const articleUpdateSchema = generateUpdateSchema(articleInputFields);

export async function updateArticle<
  TIncludeArgs extends ModelInclude<'article'> = ModelInclude<'article'>,
>({
  where,
  data: input,
  query,
  context,
}: DataUpdateInput<
  'article',
  typeof articleInputFields,
  TIncludeArgs
>): Promise<GetPayload<'article', TIncludeArgs>> {
  const plan = await composeUpdate({
    model: 'article',
    fields: articleInputFields,
    input,
    context,
    loadExisting: () => prisma.article.findUniqueOrThrow({ where }),
    authorize: ['admin'],
  });

  return commitUpdate(plan, {
    query,
    execute: async ({ tx, data }) => {
      const item = await tx.article.update({
        where,
        data,
      });
      return item;
    },
  });
}
