import type { Prisma, TodoList } from '@prisma/client';

import type {
  CreateServiceInput,
  DeleteServiceInput,
  UpdateServiceInput,
} from '@src/utils/crud-service-types.js';

import { prisma } from '@src/services/prisma.js';
import { applyDataPipeOutput } from '@src/utils/data-pipes.js';
import { createPrismaDisconnectOrConnectData } from '@src/utils/prisma-relations.js';

import type { FileUploadInput } from '../../storage/services/validate-file-input.js';

import { validateFileInput } from '../../storage/services/validate-file-input.js';
import { todoListCoverPhotoFileCategory } from '../constants/file-categories.js';

interface TodoListCreateData
  extends Pick<
    Prisma.TodoListUncheckedCreateInput,
    'position' | 'name' | 'ownerId' | 'status' | 'createdAt'
  > {
  coverPhoto?: FileUploadInput | null;
}

export async function createTodoList({
  data,
  query,
  context,
}: CreateServiceInput<
  TodoListCreateData,
  Prisma.TodoListDefaultArgs
>): Promise<TodoList> {
  const { coverPhoto, ownerId, ...rest } = data;

  const coverPhotoOutput =
    coverPhoto == null
      ? coverPhoto
      : await validateFileInput(
          coverPhoto,
          todoListCoverPhotoFileCategory,
          context,
        );

  const owner = { connect: { id: ownerId } };

  return applyDataPipeOutput(
    [coverPhotoOutput],
    prisma.todoList.create({
      data: { coverPhoto: coverPhotoOutput?.data, owner, ...rest },
      ...query,
    }),
  );
}

interface TodoListUpdateData
  extends Pick<
    Partial<Prisma.TodoListUncheckedCreateInput>,
    'position' | 'name' | 'ownerId' | 'status' | 'createdAt'
  > {
  coverPhoto?: FileUploadInput | null;
}

export async function updateTodoList({
  id,
  data,
  query,
  context,
}: UpdateServiceInput<
  string,
  TodoListUpdateData,
  Prisma.TodoListDefaultArgs
>): Promise<TodoList> {
  const { coverPhoto, ownerId, ...rest } = data;

  const existingItem = await prisma.todoList.findUniqueOrThrow({
    where: { id },
  });

  const coverPhotoOutput =
    coverPhoto == null
      ? coverPhoto
      : await validateFileInput(
          coverPhoto,
          todoListCoverPhotoFileCategory,
          context,
          existingItem.coverPhotoId,
        );

  const owner = ownerId == null ? ownerId : { connect: { id: ownerId } };

  return applyDataPipeOutput(
    [coverPhotoOutput],
    prisma.todoList.update({
      where: { id },
      data: {
        coverPhoto: createPrismaDisconnectOrConnectData(coverPhotoOutput?.data),
        owner,
        ...rest,
      },
      ...query,
    }),
  );
}

export async function deleteTodoList({
  id,
  query,
}: DeleteServiceInput<string, Prisma.TodoListDefaultArgs>): Promise<TodoList> {
  return prisma.todoList.delete({ where: { id }, ...query });
}
