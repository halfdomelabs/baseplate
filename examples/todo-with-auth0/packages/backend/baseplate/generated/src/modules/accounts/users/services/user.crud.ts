import type { Prisma, User } from '@src/generated/prisma/client.js';
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
import {
  createOneToOneCreateData,
  createOneToOneUpsertData,
} from '@src/utils/embedded-pipes/embedded-one-to-one.js';
import { createPrismaDisconnectOrConnectData } from '@src/utils/prisma-relations.js';

import type { FileUploadInput } from '../../../storage/services/validate-file-input.js';

import { validateFileInput } from '../../../storage/services/validate-file-input.js';
import {
  userImageFileFileCategory,
  userProfileAvatarFileCategory,
} from '../constants/file-categories.js';

async function prepareUpsertEmbeddedImagesData(
  data: UserEmbeddedImagesData,
  context: ServiceContext,
  whereUnique?: Prisma.UserImageWhereUniqueInput,
  parentId?: string,
): Promise<
  DataPipeOutput<{
    where: Prisma.UserImageWhereUniqueInput;
    create: Prisma.UserImageCreateWithoutUserInput;
    update: Prisma.UserImageUpdateWithoutUserInput;
  }>
> {
  const { file, ...rest } = data;

  const existingItem =
    whereUnique &&
    (await prisma.userImage.findUniqueOrThrow({ where: whereUnique }));

  if (existingItem && existingItem.userId !== parentId) {
    throw new Error('UserImage not attached to the correct parent item');
  }

  const fileOutput = await validateFileInput(
    file,
    userImageFileFileCategory,
    context,
    existingItem?.fileId,
  );

  return {
    data: {
      create: { file: fileOutput.data, ...rest },
      update: { file: fileOutput.data, ...rest },
      where: whereUnique ?? { id: '' },
    },
    operations: mergePipeOperations([fileOutput]),
  };
}

async function prepareUpsertEmbeddedUserProfileData(
  data: UserEmbeddedUserProfileData,
  context: ServiceContext,
  whereUnique?: Prisma.UserProfileWhereUniqueInput,
  parentId?: string,
): Promise<
  DataPipeOutput<{
    where?: Prisma.UserProfileWhereUniqueInput;
    create: Prisma.UserProfileCreateWithoutUserInput;
    update: Prisma.UserProfileUpdateWithoutUserInput;
  }>
> {
  const { avatar, ...rest } = data;

  const existingItem =
    whereUnique &&
    (await prisma.userProfile.findUniqueOrThrow({ where: whereUnique }));

  if (existingItem && existingItem.userId !== parentId) {
    throw new Error('UserProfile not attached to the correct parent item');
  }

  const avatarOutput =
    avatar == null
      ? avatar
      : await validateFileInput(
          avatar,
          userProfileAvatarFileCategory,
          context,
          existingItem?.avatarId,
        );

  return {
    data: {
      create: { avatar: avatarOutput?.data, ...rest },
      update: {
        avatar: createPrismaDisconnectOrConnectData(avatarOutput?.data),
        ...rest,
      },
    },
    operations: mergePipeOperations([avatarOutput]),
  };
}

type UserEmbeddedCustomerData = Pick<
  Prisma.CustomerUncheckedCreateInput,
  'stripeCustomerId'
>;

interface UserEmbeddedImagesData
  extends Pick<Prisma.UserImageUncheckedCreateInput, 'id' | 'caption'> {
  file: FileUploadInput;
}

type UserEmbeddedRolesData = Pick<Prisma.UserRoleUncheckedCreateInput, 'role'>;

interface UserEmbeddedUserProfileData
  extends Pick<
    Prisma.UserProfileUncheckedCreateInput,
    'id' | 'bio' | 'birthDay'
  > {
  avatar?: FileUploadInput | null;
}

interface UserCreateData
  extends Pick<Prisma.UserUncheckedCreateInput, 'name' | 'email'> {
  customer?: UserEmbeddedCustomerData;
  images?: UserEmbeddedImagesData[];
  roles?: UserEmbeddedRolesData[];
  userProfile?: UserEmbeddedUserProfileData;
}

export async function createUser({
  data,
  query,
  context,
}: CreateServiceInput<UserCreateData, Prisma.UserDefaultArgs>): Promise<User> {
  const { roles, customer, userProfile, images, ...rest } = data;

  const customerOutput = await createOneToOneCreateData({ input: customer });

  const imagesOutput = await createOneToManyCreateData({
    context,
    input: images,
    transform: prepareUpsertEmbeddedImagesData,
  });

  const rolesOutput = await createOneToManyCreateData({ input: roles });

  const userProfileOutput = await createOneToOneCreateData({
    context,
    input: userProfile,
    transform: prepareUpsertEmbeddedUserProfileData,
  });

  return applyDataPipeOutput(
    [rolesOutput, customerOutput, userProfileOutput, imagesOutput],
    prisma.user.create({
      data: {
        customer: { create: customerOutput.data?.create },
        images: { create: imagesOutput.data?.create },
        roles: { create: rolesOutput.data?.create },
        userProfile: { create: userProfileOutput.data?.create },
        ...rest,
      },
      ...query,
    }),
  );
}

interface UserUpdateData
  extends Pick<Partial<Prisma.UserUncheckedCreateInput>, 'name' | 'email'> {
  customer?: UserEmbeddedCustomerData | null;
  images?: UserEmbeddedImagesData[];
  roles?: UserEmbeddedRolesData[];
  userProfile?: UserEmbeddedUserProfileData | null;
}

export async function updateUser({
  id,
  data,
  query,
  context,
}: UpdateServiceInput<
  string,
  UserUpdateData,
  Prisma.UserDefaultArgs
>): Promise<User> {
  const { roles, customer, userProfile, images, ...rest } = data;

  const customerOutput = await createOneToOneUpsertData({
    deleteRelation: () => prisma.customer.deleteMany({ where: { id } }),
    input: customer,
  });

  const imagesOutput = await createOneToManyUpsertData({
    context,
    getWhereUnique: (input): Prisma.UserImageWhereUniqueInput | undefined =>
      input.id ? { id: input.id } : undefined,
    idField: 'id',
    input: images,
    parentId: id,
    transform: prepareUpsertEmbeddedImagesData,
  });

  const rolesOutput = await createOneToManyUpsertData({
    getWhereUnique: (input): Prisma.UserRoleWhereUniqueInput | undefined => ({
      userId_role: { role: input.role, userId: id },
    }),
    idField: 'role',
    input: roles,
  });

  const userProfileOutput = await createOneToOneUpsertData({
    context,
    deleteRelation: () =>
      prisma.userProfile.deleteMany({ where: { userId: id } }),
    getWhereUnique: (input): Prisma.UserProfileWhereUniqueInput | undefined =>
      input.id ? { id: input.id } : undefined,
    input: userProfile,
    parentId: id,
    transform: prepareUpsertEmbeddedUserProfileData,
  });

  return applyDataPipeOutput(
    [rolesOutput, customerOutput, userProfileOutput, imagesOutput],
    prisma.user.update({
      where: { id },
      data: {
        customer: customerOutput.data,
        images: imagesOutput.data,
        roles: rolesOutput.data,
        userProfile: userProfileOutput.data,
        ...rest,
      },
      ...query,
    }),
  );
}

export async function deleteUser({
  id,
  query,
}: DeleteServiceInput<string, Prisma.UserDefaultArgs>): Promise<User> {
  return prisma.user.delete({ where: { id }, ...query });
}
