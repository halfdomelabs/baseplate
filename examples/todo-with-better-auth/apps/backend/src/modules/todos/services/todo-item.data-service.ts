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
  todoItemAttachmentInputSchema,
  todoItemAttachmentTransformers,
} from './todo-item-attachment.data-service.js';

export const todoItemCreateSchema = z.object({
  todoListId: z.uuid(),
  position: z.int(),
  text: z.string(),
  done: z.boolean(),
  assigneeId: z.uuid().nullish(),
  attachments: z.array(todoItemAttachmentInputSchema).optional(),
});

export const todoItemUpdateSchema = todoItemCreateSchema.partial();

const todoItemTransformers = {
  attachments: oneToManyTransformer({
    parentModel: 'todoItem',
    model: 'todoItemAttachment',
    schema: todoItemAttachmentInputSchema,
    compareItem: (input, existing) => input.id === existing.id,

    processCreate:
      (itemInput, { serviceContext }) =>
      async (tx, parent) => {
        const { tags, ...rest } = itemInput;

        const plan = await prepareTransformers({
          transformers: {
            tags: todoItemAttachmentTransformers.tags.forCreate(tags),
          },
          context: serviceContext,
        });

        await executeTransformPlan(plan, {
          tx,
          execute: async () =>
            tx.todoItemAttachment.create({
              data: {
                ...rest,
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
          context: serviceContext,
        });

        await executeTransformPlan(plan, {
          tx,
          execute: async () =>
            tx.todoItemAttachment.update({
              where: { id: existingItem.id },
              data: rest,
            }),
        });
      },

    deleteRemoved: async (removedItems, tx) => {
      await tx.todoItemAttachment.deleteMany({
        where: { OR: removedItems.map((i) => ({ id: i.id })) },
      });
    },
  }),
};

export async function createTodoItem<TQuery extends DataQuery<'todoItem'>>({
  data: input,
  query,
  context,
}: {
  data: z.infer<typeof todoItemCreateSchema>;
  query?: TQuery;
  context: ServiceContext;
}): Promise<GetResult<'todoItem', TQuery>> {
  checkGlobalAuthorization(context, ['user']);
  const { assigneeId, todoListId, attachments, ...rest } = input;

  const plan = await prepareTransformers({
    transformers: {
      attachments: todoItemTransformers.attachments.forCreate(attachments),
    },
    context,
  });

  const result = await executeTransformPlan(plan, {
    execute: async ({ tx }) =>
      tx.todoItem.create({
        data: {
          ...rest,
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
  data: input,
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
  const { assigneeId, todoListId, attachments, ...rest } = input;

  const plan = await prepareTransformers({
    transformers: {
      attachments: todoItemTransformers.attachments.forUpdate(attachments, {
        loadExisting: () =>
          prisma.todoItemAttachment.findMany({
            where: { todoItemId: existingItem.id },
          }),
      }),
    },
    context,
  });

  const result = await executeTransformPlan(plan, {
    execute: async ({ tx }) =>
      tx.todoItem.update({
        where,
        data: {
          ...rest,
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
