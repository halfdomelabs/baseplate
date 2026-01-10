import { queryFromInfo } from '@pothos/plugin-prisma';

import { builder } from '@src/plugins/graphql/builder.js';

import { fileInputInputType } from '../../../storage/schema/file-input.input-type.js';
import {
  createUser,
  deleteUser,
  updateUser,
} from '../services/user.data-service.js';
import { userObjectType } from './user.object-type.js';

const userCustomerNestedInputInputType = builder.inputType(
  'UserCustomerNestedInput',
  {
    fields: (t) => ({ stripeCustomerId: t.string({ required: true }) }),
  },
);

const userImagesNestedInputInputType = builder.inputType(
  'UserImagesNestedInput',
  {
    fields: (t) => ({
      id: t.id(),
      caption: t.string({ required: true }),
      file: t.field({ required: true, type: fileInputInputType }),
    }),
  },
);

const userRolesNestedInputInputType = builder.inputType(
  'UserRolesNestedInput',
  {
    fields: (t) => ({ role: t.string({ required: true }) }),
  },
);

const userUserProfileNestedInputInputType = builder.inputType(
  'UserUserProfileNestedInput',
  {
    fields: (t) => ({
      id: t.id(),
      bio: t.string(),
      birthDay: t.field({ type: 'Date' }),
      favoriteTodoListId: t.field({ type: 'Uuid' }),
      avatar: t.field({ type: fileInputInputType }),
    }),
  },
);

const createUserDataInputType = builder
  .inputType('CreateUserData', {
    fields: (t) => ({
      name: t.string(),
      email: t.string({ required: true }),
      customer: t.field({ type: userCustomerNestedInputInputType }),
      images: t.field({ type: [userImagesNestedInputInputType] }),
      roles: t.field({ type: [userRolesNestedInputInputType] }),
      userProfile: t.field({ type: userUserProfileNestedInputInputType }),
    }),
  })
  .validate(createUser.$dataSchema);

builder.mutationField('createUser', (t) =>
  t.fieldWithInputPayload({
    input: {
      data: t.input.field({ required: true, type: createUserDataInputType }),
    },
    payload: { user: t.payload.field({ type: userObjectType }) },
    authorize: ['admin'],
    resolve: async (root, { input: { data } }, context, info) => {
      const user = await createUser({
        data,
        context,
        query: queryFromInfo({ context, info, path: ['user'] }),
        skipValidation: true,
      });
      return { user };
    },
  }),
);

const updateUserDataInputType = builder
  .inputType('UpdateUserData', {
    fields: (t) => ({
      name: t.string(),
      email: t.string(),
      customer: t.field({ type: userCustomerNestedInputInputType }),
      images: t.field({ type: [userImagesNestedInputInputType] }),
      roles: t.field({ type: [userRolesNestedInputInputType] }),
      userProfile: t.field({ type: userUserProfileNestedInputInputType }),
    }),
  })
  .validate(updateUser.$dataSchema);

builder.mutationField('updateUser', (t) =>
  t.fieldWithInputPayload({
    input: {
      id: t.input.field({ required: true, type: 'Uuid' }),
      data: t.input.field({ required: true, type: updateUserDataInputType }),
    },
    payload: { user: t.payload.field({ type: userObjectType }) },
    authorize: ['admin'],
    resolve: async (root, { input: { id, data } }, context, info) => {
      const user = await updateUser({
        where: { id },
        data,
        context,
        query: queryFromInfo({ context, info, path: ['user'] }),
        skipValidation: true,
      });
      return { user };
    },
  }),
);

builder.mutationField('deleteUser', (t) =>
  t.fieldWithInputPayload({
    input: { id: t.input.field({ required: true, type: 'Uuid' }) },
    payload: { user: t.payload.field({ type: userObjectType }) },
    authorize: ['admin'],
    resolve: async (root, { input: { id } }, context, info) => {
      const user = await deleteUser({
        where: { id },
        context,
        query: queryFromInfo({ context, info, path: ['user'] }),
      });
      return { user };
    },
  }),
);
