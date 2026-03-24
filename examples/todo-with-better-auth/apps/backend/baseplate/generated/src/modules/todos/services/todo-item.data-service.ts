import { omit } from 'es-toolkit';
import { z } from 'zod';

import type {
  DataQuery,
  GetResult,
} from '@src/utils/data-operations/prisma-types.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';
import {
  checkGlobalAuthorization,
  checkInstanceAuthorization,
} from '@src/utils/authorizers.js';
import { executeTransformPlan } from '@src/utils/data-operations/execute-transform-plan.js';
import { oneToManyTransformer } from '@src/utils/data-operations/nested-transformers.js';
import { prepareTransformers } from '@src/utils/data-operations/prepare-transformers.js';
import { relationHelpers } from '@src/utils/data-operations/relation-helpers.js';

import { todoItemAuthorizer } from '../authorizers/todo-item.authorizer.js';
import {
  todoItemAttachmentFieldSchemas,
  todoItemAttachmentTransformers,
} from './todo-item-attachment.data-service.js';

const todoItemFieldSchemas = z.object({
  todoListId: z.uuid(),
  position: z.int(),
  text: z.string(),
  done: z.boolean(),
  assigneeId: z.uuid().nullish(),
  attachments: z.array(todoItemAttachmentFieldSchemas).optional(),
});

export const todoItemCreateSchema = todoItemFieldSchemas;

export const todoItemUpdateSchema = todoItemFieldSchemas.partial();

export const todoItemTransformers = {
  attachments: oneToManyTransformer({
    compareItem: (input, existing) => input.id === existing.id,
    deleteRemoved: async (tx, removedItems) => {
      await tx.todoItemAttachment.deleteMany({
        where: { OR: removedItems.map((i) => ({ id: i.id })) },
      });
    },
    model: 'todoItemAttachment',
    parentModel: 'todoItem',
    processCreate:
      (itemInput, { serviceContext }) =>
      async (tx, parent) => {
        const { tags, ...rest } = itemInput;

        const plan = await prepareTransformers({
          transformers: {
            tags: todoItemAttachmentTransformers.tags.forCreate(tags),
          },
          serviceContext,
        });

        await executeTransformPlan(plan, {
          tx,
          execute: async ({ transformed }) =>
            tx.todoItemAttachment.create({
              data: {
                ...rest,
                ...transformed,
                todoItem: { connect: { id: parent.id } },
              },
            }),
        });
      },
    processUpdate:
      (itemInput, existingItem, { serviceContext }) =>
      async (tx) => {
        const { tags, ...rest } = itemInput;

        const plan = await prepareTransformers({
          transformers: {
            tags: todoItemAttachmentTransformers.tags.forUpdate(tags, {
              loadExisting: () =>
                prisma.todoItemAttachmentTag.findMany({
                  where: { todoItemAttachmentId: existingItem.id },
                }),
            }),
          },
          serviceContext,
        });

        await executeTransformPlan(plan, {
          tx,
          execute: async ({ transformed }) =>
            tx.todoItemAttachment.update({
              where: { id: existingItem.id },
              data: { ...omit(rest, ['id']), ...transformed },
            }),
        });
      },
    schema: todoItemAttachmentFieldSchemas,
  }),
};

export async function createTodoItem<TQuery extends DataQuery<'todoItem'>>({
  data,
  query,
  context,
}: {
  data: z.infer<typeof todoItemCreateSchema>;
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'todoItem', TQuery>> {
  checkGlobalAuthorization(context, ['user']);
  const { attachments, assigneeId, todoListId, ...rest } = data;

  const plan = await prepareTransformers({
    transformers: {
      attachments: todoItemTransformers.attachments.forCreate(attachments),
    },
    serviceContext: context,
  });

  const result = await executeTransformPlan(plan, {
    execute: async ({ tx, transformed }) =>
      tx.todoItem.create({
        data: {
          ...rest,
          ...transformed,
          assignee: relationHelpers.connectCreate({ id: assigneeId }),
          todoList: relationHelpers.connectCreate({ id: todoListId }),
        },
      }),
    refetch: (item) =>
      prisma.todoItem.findUniqueOrThrow({ where: { id: item.id }, ...query }),
  });

  return result as GetResult<'todoItem', TQuery>;
}

export async function updateTodoItem<TQuery extends DataQuery<'todoItem'>>({
  where,
  data,
  query,
  context,
}: {
  where: { id: string };
  data: z.infer<typeof todoItemUpdateSchema>;
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'todoItem', TQuery>> {
  const existingItem = await prisma.todoItem.findUniqueOrThrow({ where });
  await checkInstanceAuthorization(context, existingItem, [
    'admin',
    todoItemAuthorizer.roles.owner,
  ]);
  const { attachments, assigneeId, todoListId, ...rest } = data;

  const plan = await prepareTransformers({
    transformers: {
      attachments: todoItemTransformers.attachments.forUpdate(attachments, {
        loadExisting: () =>
          prisma.todoItemAttachment.findMany({
            where: { todoItemId: where.id },
          }),
      }),
    },
    serviceContext: context,
  });

  const result = await executeTransformPlan(plan, {
    execute: async ({ tx, transformed }) =>
      tx.todoItem.update({
        where,
        data: {
          ...rest,
          ...transformed,
          assignee: relationHelpers.connectUpdate({ id: assigneeId }),
          todoList: relationHelpers.connectUpdate({ id: todoListId }),
        },
      }),
    refetch: (item) =>
      prisma.todoItem.findUniqueOrThrow({ where: { id: item.id }, ...query }),
  });

  return result as GetResult<'todoItem', TQuery>;
}

export async function deleteTodoItem<TQuery extends DataQuery<'todoItem'>>({
  where,
  query,
  context,
}: {
  where: { id: string };
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'todoItem', TQuery>> {
  const existingItem = await prisma.todoItem.findUniqueOrThrow({ where });
  await checkInstanceAuthorization(context, existingItem, [
    'admin',
    todoItemAuthorizer.roles.owner,
  ]);

  const result = await prisma.todoItem.delete({
    where,
    ...query,
  });

  return result as GetResult<'todoItem', TQuery>;
}
