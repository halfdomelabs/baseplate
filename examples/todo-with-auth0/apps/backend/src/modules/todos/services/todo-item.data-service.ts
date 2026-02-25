import { pick } from 'es-toolkit';
import { z } from 'zod';

import type {
  GetPayload,
  ModelQuery,
} from '@src/utils/data-operations/prisma-types.js';
import type {
  DataCreateInput,
  DataDeleteInput,
  DataUpdateInput,
} from '@src/utils/data-operations/types.js';

import { prisma } from '@src/services/prisma.js';
import {
  commitCreate,
  commitDelete,
  commitUpdate,
} from '@src/utils/data-operations/commit-operations.js';
import {
  composeCreate,
  composeUpdate,
} from '@src/utils/data-operations/compose-operations.js';
import {
  generateCreateSchema,
  generateUpdateSchema,
} from '@src/utils/data-operations/define-operations.js';
import {
  createParentModelConfig,
  nestedOneToManyField,
  scalarField,
} from '@src/utils/data-operations/field-definitions.js';
import { relationHelpers } from '@src/utils/data-operations/relation-helpers.js';

import { todoItemAttachmentInputFields } from './todo-item-attachment.data-service.js';

const parentModel = createParentModelConfig('todoItem', (value) => ({
  id: value.id,
}));

export const todoItemInputFields = {
  todoListId: scalarField(z.uuid()),
  position: scalarField(z.int()),
  text: scalarField(z.string()),
  done: scalarField(z.boolean()),
  assigneeId: scalarField(z.uuid().nullish()),
  attachments: nestedOneToManyField({
    buildCreateData: (data) => data,
    buildUpdateData: (data) => data,
    fields: pick(todoItemAttachmentInputFields, [
      'position',
      'url',
      'id',
      'tags',
    ] as const),
    getWhereUnique: (input) => (input.id ? { id: input.id } : undefined),
    model: 'todoItemAttachment',
    parentModel,
    relationName: 'todoItem',
  }),
};

export const todoItemCreateSchema = generateCreateSchema(todoItemInputFields);

export async function createTodoItem<
  TQueryArgs extends ModelQuery<'todoItem'> = ModelQuery<'todoItem'>,
>({
  data: input,
  query,
  context,
}: DataCreateInput<
  'todoItem',
  typeof todoItemInputFields,
  TQueryArgs
>): Promise<GetPayload<'todoItem', TQueryArgs>> {
  const plan = await composeCreate({
    model: 'todoItem',
    fields: todoItemInputFields,
    input,
    context,
  });

  return commitCreate(plan, {
    query,
    execute: async ({ tx, data: { assigneeId, todoListId, ...rest }, query }) =>
      tx.todoItem.create({
        data: {
          ...rest,
          assignee: relationHelpers.connectCreate({ id: assigneeId }),
          todoList: relationHelpers.connectCreate({ id: todoListId }),
        },
        ...query,
      }),
  });
}

export const todoItemUpdateSchema = generateUpdateSchema(todoItemInputFields);

export async function updateTodoItem<
  TQueryArgs extends ModelQuery<'todoItem'> = ModelQuery<'todoItem'>,
>({
  where,
  data: input,
  query,
  context,
}: DataUpdateInput<
  'todoItem',
  typeof todoItemInputFields,
  TQueryArgs
>): Promise<GetPayload<'todoItem', TQueryArgs>> {
  const plan = await composeUpdate({
    model: 'todoItem',
    fields: todoItemInputFields,
    input,
    context,
    loadExisting: () => prisma.todoItem.findUniqueOrThrow({ where }),
  });

  return commitUpdate(plan, {
    query,
    execute: async ({ tx, data: { assigneeId, todoListId, ...rest }, query }) =>
      tx.todoItem.update({
        where,
        data: {
          ...rest,
          assignee: relationHelpers.connectUpdate({ id: assigneeId }),
          todoList: relationHelpers.connectUpdate({ id: todoListId }),
        },
        ...query,
      }),
  });
}

export async function deleteTodoItem<
  TQueryArgs extends ModelQuery<'todoItem'> = ModelQuery<'todoItem'>,
>({
  where,
  query,
  context,
}: DataDeleteInput<'todoItem', TQueryArgs>): Promise<
  GetPayload<'todoItem', TQueryArgs>
> {
  return commitDelete({
    model: 'todoItem',
    where,
    query,
    context,
    execute: async ({ tx, where, query }) =>
      await tx.todoItem.delete({
        where,
        ...query,
      }),
  });
}
