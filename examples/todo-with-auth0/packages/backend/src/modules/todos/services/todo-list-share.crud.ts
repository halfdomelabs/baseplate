import type { Prisma, TodoListShare } from '@prisma/client';

import type {
  CreateServiceInput,
  DeleteServiceInput,
  UpdateServiceInput,
} from '@src/utils/crud-service-types.js';

import { prisma } from '@src/services/prisma.js';

type TodoListShareCreateData = Pick<
  Prisma.TodoListShareUncheckedCreateInput,
  'todoListId' | 'userId' | 'updatedAt' | 'createdAt'
>;

export async function createTodoListShare({
  data,
  query,
}: CreateServiceInput<
  TodoListShareCreateData,
  Prisma.TodoListShareDefaultArgs
>): Promise<TodoListShare> {
  return prisma.todoListShare.create({ data, ...query });
}

export type TodoListSharePrimaryKey = Pick<
  TodoListShare,
  'todoListId' | 'userId'
>;

type TodoListShareUpdateData = Pick<
  Partial<Prisma.TodoListShareUncheckedCreateInput>,
  'todoListId' | 'userId' | 'updatedAt' | 'createdAt'
>;

export async function updateTodoListShare({
  id: todoListId_userId,
  data,
  query,
}: UpdateServiceInput<
  TodoListSharePrimaryKey,
  TodoListShareUpdateData,
  Prisma.TodoListShareDefaultArgs
>): Promise<TodoListShare> {
  return prisma.todoListShare.update({
    where: { todoListId_userId },
    data,
    ...query,
  });
}

export async function deleteTodoListShare({
  id: todoListId_userId,
  query,
}: DeleteServiceInput<
  TodoListSharePrimaryKey,
  Prisma.TodoListShareDefaultArgs
>): Promise<TodoListShare> {
  return prisma.todoListShare.delete({
    where: { todoListId_userId },
    ...query,
  });
}
