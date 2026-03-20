import { z } from 'zod';

import type {
  DataQuery,
  GetResult,
} from '@src/utils/data-operations/prisma-types.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';
import { checkGlobalAuthorization } from '@src/utils/authorizers.js';
import { relationHelpers } from '@src/utils/data-operations/relation-helpers.js';

const todoListShareFieldSchemas = {
  todoListId: z.uuid(),
  userId: z.uuid(),
  updatedAt: z.date().optional(),
  createdAt: z.date().optional(),
};

export const todoListShareCreateSchema = z.object(todoListShareFieldSchemas);

export const todoListShareUpdateSchema = z
  .object(todoListShareFieldSchemas)
  .partial();

export async function createTodoListShare<
  TQuery extends DataQuery<'todoListShare'>,
>({
  data,
  query,
  context,
}: {
  data: z.infer<typeof todoListShareCreateSchema>;
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'todoListShare', TQuery>> {
  checkGlobalAuthorization(context, ['user']);
  const { todoListId, userId, ...rest } = data;

  const result = await prisma.todoListShare.create({
    data: {
      ...rest,
      todoList: relationHelpers.connectCreate({ id: todoListId }),
      user: relationHelpers.connectCreate({ id: userId }),
    },
    ...query,
  });

  return result as GetResult<'todoListShare', TQuery>;
}

export async function updateTodoListShare<
  TQuery extends DataQuery<'todoListShare'>,
>({
  where,
  data,
  query,
  context,
}: {
  where: { todoListId_userId: { todoListId: string; userId: string } };
  data: z.infer<typeof todoListShareUpdateSchema>;
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'todoListShare', TQuery>> {
  checkGlobalAuthorization(context, ['user']);
  const { todoListId, userId, ...rest } = data;

  const result = await prisma.todoListShare.update({
    where,
    data: {
      ...rest,
      todoList: relationHelpers.connectUpdate({ id: todoListId }),
      user: relationHelpers.connectUpdate({ id: userId }),
    },
    ...query,
  });

  return result as GetResult<'todoListShare', TQuery>;
}

export async function deleteTodoListShare<
  TQuery extends DataQuery<'todoListShare'>,
>({
  where,
  query,
  context,
}: {
  where: { todoListId_userId: { todoListId: string; userId: string } };
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'todoListShare', TQuery>> {
  checkGlobalAuthorization(context, ['user']);

  const result = await prisma.todoListShare.delete({
    where,
    ...query,
  });

  return result as GetResult<'todoListShare', TQuery>;
}
