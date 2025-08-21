import type { Prisma, TodoItem } from '@prisma/client';

import type {
  CreateServiceInput,
  DeleteServiceInput,
  UpdateServiceInput,
} from '@src/utils/crud-service-types.js';
import type { DataPipeOutput } from '@src/utils/data-pipes.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';
import {
  applyDataPipeOutput,
  mergePipeOperations,
} from '@src/utils/data-pipes.js';
import {
  createOneToManyCreateData,
  createOneToManyUpsertData,
} from '@src/utils/embedded-pipes/embedded-one-to-many.js';
import { createPrismaDisconnectOrConnectData } from '@src/utils/prisma-relations.js';

async function prepareUpsertEmbeddedAttachmentsData(
  data: TodoItemEmbeddedAttachmentsData,
  context: ServiceContext,
  whereUnique?: Prisma.TodoItemAttachmentWhereUniqueInput,
  parentId?: string,
): Promise<
  DataPipeOutput<{
    where: Prisma.TodoItemAttachmentWhereUniqueInput;
    create: Prisma.TodoItemAttachmentCreateWithoutTodoItemInput;
    update: Prisma.TodoItemAttachmentUpdateWithoutTodoItemInput;
  }>
> {
  const { tags, ...rest } = data;

  const existingItem =
    whereUnique &&
    (await prisma.todoItemAttachment.findUniqueOrThrow({ where: whereUnique }));

  if (existingItem && existingItem.todoItemId !== parentId) {
    throw new Error(
      'TodoItemAttachment not attached to the correct parent item',
    );
  }

  const tagsOutput = await createOneToManyUpsertData({
    getWhereUnique: (
      input,
    ): Prisma.TodoItemAttachmentTagWhereUniqueInput | undefined =>
      existingItem
        ? {
            todoItemAttachmentId_tag: {
              tag: input.tag,
              todoItemAttachmentId: existingItem.id,
            },
          }
        : undefined,
    idField: 'tag',
    input: tags,
  });

  return {
    data: {
      create: { tags: { create: tagsOutput.data?.create }, ...rest },
      update: { tags: tagsOutput.data, ...rest },
      where: whereUnique ?? { id: '' },
    },
    operations: mergePipeOperations([tagsOutput]),
  };
}

type TodoItemAttachmentEmbeddedTagsData = Pick<
  Prisma.TodoItemAttachmentTagUncheckedCreateInput,
  'tag'
>;

interface TodoItemEmbeddedAttachmentsData
  extends Pick<
    Prisma.TodoItemAttachmentUncheckedCreateInput,
    'position' | 'url' | 'id'
  > {
  tags?: TodoItemAttachmentEmbeddedTagsData[];
}

interface TodoItemCreateData
  extends Pick<
    Prisma.TodoItemUncheckedCreateInput,
    'todoListId' | 'position' | 'text' | 'done' | 'assigneeId'
  > {
  attachments?: TodoItemEmbeddedAttachmentsData[];
}

export async function createTodoItem({
  data,
  query,
  context,
}: CreateServiceInput<
  TodoItemCreateData,
  Prisma.TodoItemDefaultArgs
>): Promise<TodoItem> {
  const { attachments, assigneeId, todoListId, ...rest } = data;

  const assignee =
    assigneeId == null ? undefined : { connect: { id: assigneeId } };

  const attachmentsOutput = await createOneToManyCreateData({
    context,
    input: attachments,
    transform: prepareUpsertEmbeddedAttachmentsData,
  });

  const todoList = { connect: { id: todoListId } };

  return applyDataPipeOutput(
    [attachmentsOutput],
    prisma.todoItem.create({
      data: {
        assignee,
        attachments: { create: attachmentsOutput.data?.create },
        todoList,
        ...rest,
      },
      ...query,
    }),
  );
}

interface TodoItemUpdateData
  extends Pick<
    Partial<Prisma.TodoItemUncheckedCreateInput>,
    'position' | 'text' | 'done' | 'assigneeId' | 'todoListId'
  > {
  attachments?: TodoItemEmbeddedAttachmentsData[];
}

export async function updateTodoItem({
  id,
  data,
  query,
  context,
}: UpdateServiceInput<
  string,
  TodoItemUpdateData,
  Prisma.TodoItemDefaultArgs
>): Promise<TodoItem> {
  const { attachments, assigneeId, todoListId, ...rest } = data;

  const assignee =
    assigneeId == null ? assigneeId : { connect: { id: assigneeId } };

  const attachmentsOutput = await createOneToManyUpsertData({
    context,
    getWhereUnique: (
      input,
    ): Prisma.TodoItemAttachmentWhereUniqueInput | undefined =>
      input.id ? { id: input.id } : undefined,
    idField: 'id',
    input: attachments,
    parentId: id,
    transform: prepareUpsertEmbeddedAttachmentsData,
  });

  const todoList =
    todoListId == null ? todoListId : { connect: { id: todoListId } };

  return applyDataPipeOutput(
    [attachmentsOutput],
    prisma.todoItem.update({
      where: { id },
      data: {
        assignee: createPrismaDisconnectOrConnectData(assignee),
        attachments: attachmentsOutput.data,
        todoList,
        ...rest,
      },
      ...query,
    }),
  );
}

export async function deleteTodoItem({
  id,
  query,
}: DeleteServiceInput<string, Prisma.TodoItemDefaultArgs>): Promise<TodoItem> {
  return prisma.todoItem.delete({ where: { id }, ...query });
}
