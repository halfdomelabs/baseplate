import { z } from 'zod';

import type {
  GetPayload,
  ModelInclude,
} from '@src/utils/data-operations/prisma-types.js';
import type {
  DataDeleteInput,
  DataUpdateInput,
} from '@src/utils/data-operations/types.js';

import { prisma } from '@src/services/prisma.js';
import {
  commitDelete,
  commitUpdate,
} from '@src/utils/data-operations/commit-operations.js';
import { composeUpdate } from '@src/utils/data-operations/compose-operations.js';
import { scalarField } from '@src/utils/data-operations/field-definitions.js';
import { generateUpdateSchema } from '@src/utils/data-operations/field-utils.js';
import { relationHelpers } from '@src/utils/data-operations/relation-helpers.js';

import { blogAuthorizer } from '../authorizers/blog.authorizer.js';

export const blogInputFields = {
  name: scalarField(z.string()),
  userId: scalarField(z.uuid()),
};

export const blogUpdateSchema = generateUpdateSchema(blogInputFields);

export async function updateBlog<
  TIncludeArgs extends ModelInclude<'blog'> = ModelInclude<'blog'>,
>({
  where,
  data: input,
  query,
  context,
}: DataUpdateInput<'blog', typeof blogInputFields, TIncludeArgs>): Promise<
  GetPayload<'blog', TIncludeArgs>
> {
  const plan = await composeUpdate({
    model: 'blog',
    fields: blogInputFields,
    input,
    context,
    loadExisting: () => prisma.blog.findUniqueOrThrow({ where }),
    authorize: ['admin', blogAuthorizer.roles.owner],
  });

  const item = await commitUpdate(plan, {
    query,
    execute: async ({ tx, data: { userId, ...rest }, query }) => {
      const item = await tx.blog.update({
        where,
        data: { ...rest, user: relationHelpers.connectUpdate({ id: userId }) },
        ...query,
      });
      return item;
    },
  });

  return item;
}

export async function deleteBlog<
  TIncludeArgs extends ModelInclude<'blog'> = ModelInclude<'blog'>,
>({
  where,
  query,
  context,
}: DataDeleteInput<'blog', TIncludeArgs>): Promise<
  GetPayload<'blog', TIncludeArgs>
> {
  const item = await commitDelete({
    model: 'blog',
    query,
    context,
    execute: async ({ tx, query }) => {
      const item = await tx.blog.delete({
        where,
        ...query,
      });
      return item;
    },
    authorize: ['admin', blogAuthorizer.roles.owner],
    loadExisting: () => prisma.blog.findUniqueOrThrow({ where }),
  });

  return item;
}
