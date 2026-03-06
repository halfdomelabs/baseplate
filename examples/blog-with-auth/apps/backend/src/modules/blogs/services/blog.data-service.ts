import { z } from 'zod';

import type {
  GetPayload,
  ModelQuery,
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
  TQueryArgs extends ModelQuery<'blog'> = ModelQuery<'blog'>,
>({
  where,
  data: input,
  query,
  context,
}: DataUpdateInput<'blog', typeof blogInputFields, TQueryArgs>): Promise<
  GetPayload<'blog', TQueryArgs>
> {
  const plan = await composeUpdate({
    model: 'blog',
    fields: blogInputFields,
    input,
    context,
    loadExisting: () => prisma.blog.findUniqueOrThrow({ where }),
    authorize: ['admin', blogAuthorizer.roles.owner],
  });

  return commitUpdate(plan, {
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
}

export async function deleteBlog<
  TQueryArgs extends ModelQuery<'blog'> = ModelQuery<'blog'>,
>({
  where,
  query,
  context,
}: DataDeleteInput<'blog', TQueryArgs>): Promise<
  GetPayload<'blog', TQueryArgs>
> {
  return commitDelete({
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
}
