import { pick } from 'es-toolkit';
import { z } from 'zod';

import type {
  DataQuery,
  GetResult,
} from '@src/utils/data-operations/prisma-types.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';
import { checkGlobalAuthorization } from '@src/utils/authorizers.js';

const userFieldSchemas = {
  email: z.string().nullish(),
  phone: z.string().nullish(),
  name: z.string().nullish(),
  emailVerified: z.boolean().optional(),
};

export const userCreateSchema = z.object(
  pick(userFieldSchemas, ['email', 'name', 'emailVerified']),
);

export const userUpdateSchema = z.object(userFieldSchemas).partial();

export async function createUser<TQuery extends DataQuery<'user'>>({
  data,
  query,
  context,
}: {
  data: z.infer<typeof userCreateSchema>;
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'user', TQuery>> {
  checkGlobalAuthorization(context, ['admin']);

  const result = await prisma.user.create({
    data,
    ...query,
  });

  return result as GetResult<'user', TQuery>;
}

export async function updateUser<TQuery extends DataQuery<'user'>>({
  where,
  data,
  query,
  context,
}: {
  where: { id: string };
  data: z.infer<typeof userUpdateSchema>;
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'user', TQuery>> {
  checkGlobalAuthorization(context, ['admin']);

  const result = await prisma.user.update({
    where,
    data,
    ...query,
  });

  return result as GetResult<'user', TQuery>;
}

export async function deleteUser<TQuery extends DataQuery<'user'>>({
  where,
  query,
  context,
}: {
  where: { id: string };
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'user', TQuery>> {
  checkGlobalAuthorization(context, ['admin']);

  const result = await prisma.user.delete({
    where,
    ...query,
  });

  return result as GetResult<'user', TQuery>;
}
