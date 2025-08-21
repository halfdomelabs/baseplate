import type { Prisma, User } from '@prisma/client';

import type {
  CreateServiceInput,
  DeleteServiceInput,
  UpdateServiceInput,
} from '@src/utils/crud-service-types.js';

import { prisma } from '@src/services/prisma.js';

type UserCreateData = Pick<
  Prisma.UserUncheckedCreateInput,
  'name' | 'emailVerified' | 'email'
>;

export async function createUser({
  data,
  query,
}: CreateServiceInput<UserCreateData, Prisma.UserDefaultArgs>): Promise<User> {
  return prisma.user.create({ data, ...query });
}

type UserUpdateData = Pick<
  Partial<Prisma.UserUncheckedCreateInput>,
  'name' | 'emailVerified' | 'email'
>;

export async function updateUser({
  id,
  data,
  query,
}: UpdateServiceInput<
  string,
  UserUpdateData,
  Prisma.UserDefaultArgs
>): Promise<User> {
  return prisma.user.update({ where: { id }, data, ...query });
}

export async function deleteUser({
  id,
  query,
}: DeleteServiceInput<string, Prisma.UserDefaultArgs>): Promise<User> {
  return prisma.user.delete({ where: { id }, ...query });
}
