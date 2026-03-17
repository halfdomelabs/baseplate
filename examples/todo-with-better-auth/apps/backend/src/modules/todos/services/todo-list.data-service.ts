import { z } from 'zod';

import type {
  DataQuery,
  GetResult,
} from '@src/utils/data-operations/prisma-types.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { $Enums } from '@src/generated/prisma/client.js';
import { prisma } from '@src/services/prisma.js';
import { checkGlobalAuthorization } from '@src/utils/authorizers.js';
import { executeTransformPlan } from '@src/utils/data-operations/execute-transform-plan.js';
import { prepareTransformers } from '@src/utils/data-operations/prepare-transformers.js';
import { relationHelpers } from '@src/utils/data-operations/relation-helpers.js';

import {
  fileInputSchema,
  fileTransformer,
} from '../../storage/services/file-transformer.js';
import { todoListCoverPhotoFileCategory } from '../constants/file-categories.js';

const coverPhotoTransformer = fileTransformer({
  category: todoListCoverPhotoFileCategory,
  optional: true,
});

const todoListFieldSchemas = {
  ownerId: z.uuid(),
  position: z.int(),
  name: z.string(),
  createdAt: z.date().optional(),
  status: z.enum($Enums.TodoListStatus).nullish(),
  coverPhoto: fileInputSchema.nullish(),
};

export const todoListCreateSchema = z.object(todoListFieldSchemas);

export async function createTodoList<
  TQuery extends DataQuery<'todoList'> = DataQuery<'todoList'>,
>({
  data: input,
  query,
  context,
}: {
  data: z.infer<typeof todoListCreateSchema>;
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'todoList', TQuery>> {
  checkGlobalAuthorization(context, ['user']);
  const { coverPhoto, ownerId, ...rest } = input;

  const plan = await prepareTransformers({
    transformers: {
      coverPhoto: coverPhotoTransformer.forCreate(coverPhoto),
    },
    context,
  });

  const result = await executeTransformPlan(plan, {
    execute: async ({ tx, transformed }) =>
      tx.todoList.create({
        data: {
          ...rest,
          ...transformed,
          owner: relationHelpers.connectCreate({ id: ownerId }),
        },
      }),
    refetch: (item) =>
      prisma.todoList.findUniqueOrThrow({ where: { id: item.id }, ...query }),
  });

  return result as GetResult<'todoList', TQuery>;
}

export const todoListUpdateSchema = z.object(todoListFieldSchemas).partial();

export async function updateTodoList<TQuery extends DataQuery<'todoList'>>({
  where,
  data: input,
  query,
  context,
}: {
  where: { id: string };
  data: z.infer<typeof todoListUpdateSchema>;
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'todoList', TQuery>> {
  checkGlobalAuthorization(context, ['user']);
  const existingItem = await prisma.todoList.findUniqueOrThrow({ where });
  const { coverPhoto, ownerId, ...rest } = input;

  const plan = await prepareTransformers({
    transformers: {
      coverPhoto: coverPhotoTransformer.forUpdate(
        coverPhoto,
        existingItem.coverPhotoId,
      ),
    },
    context,
  });

  const result = await executeTransformPlan(plan, {
    execute: async ({ tx, transformed }) =>
      tx.todoList.update({
        where,
        data: {
          ...rest,
          ...transformed,
          owner: relationHelpers.connectUpdate({ id: ownerId }),
        },
      }),
    refetch: (item) =>
      prisma.todoList.findUniqueOrThrow({ where: { id: item.id }, ...query }),
  });

  return result as GetResult<'todoList', TQuery>;
}

export async function deleteTodoList<TQuery extends DataQuery<'todoList'>>({
  where,
  query,
  context,
}: {
  where: { id: string };
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'todoList', TQuery>> {
  checkGlobalAuthorization(context, ['user']);

  const result = await prisma.todoList.delete({
    where,
    ...query,
  });

  return result as GetResult<'todoList', TQuery>;
}
