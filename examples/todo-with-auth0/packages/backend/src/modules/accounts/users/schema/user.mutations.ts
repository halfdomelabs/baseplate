import { queryFromInfo } from '@pothos/plugin-prisma';

import { builder } from '@src/plugins/graphql/builder.js';
import { restrictObjectNulls } from '@src/utils/nulls.js';

import { fileInputInputType } from '../../../storage/schema/file-input.input-type.js';
import { createUser, deleteUser, updateUser } from '../services/user.crud.js';
import { userObjectType } from './user.object-type.js';

const userEmbeddedCustomerDataInputType = builder.inputType(
  'UserEmbeddedCustomerData',
  {
    fields: (t) => ({ stripeCustomerId: t.string({ required: true }) }),
  },
);

const userEmbeddedImagesDataInputType = builder.inputType(
  'UserEmbeddedImagesData',
  {
    fields: (t) => ({
      id: t.field({ type: 'Uuid' }),
      caption: t.string({ required: true }),
      file: t.field({ required: true, type: fileInputInputType }),
    }),
  },
);

const userEmbeddedRolesDataInputType = builder.inputType(
  'UserEmbeddedRolesData',
  {
    fields: (t) => ({ role: t.string({ required: true }) }),
  },
);

const userEmbeddedUserProfileDataInputType = builder.inputType(
  'UserEmbeddedUserProfileData',
  {
    fields: (t) => ({
      id: t.field({ type: 'Uuid' }),
      bio: t.string(),
      birthDay: t.field({ type: 'Date' }),
      avatar: t.field({ type: fileInputInputType }),
    }),
  },
);

const userCreateDataInputType = builder.inputType('UserCreateData', {
  fields: (t) => ({
    name: t.string(),
    email: t.string({ required: true }),
    roles: t.field({ type: [userEmbeddedRolesDataInputType] }),
    customer: t.field({ type: userEmbeddedCustomerDataInputType }),
    userProfile: t.field({ type: userEmbeddedUserProfileDataInputType }),
    images: t.field({ type: [userEmbeddedImagesDataInputType] }),
  }),
});

builder.mutationField('createUser', (t) =>
  t.fieldWithInputPayload({
    input: {
      data: t.input.field({ required: true, type: userCreateDataInputType }),
    },
    payload: { user: t.payload.field({ type: userObjectType }) },
    authorize: ['admin'],
    resolve: async (root, { input: { data } }, context, info) => {
      const user = await createUser({
        data: restrictObjectNulls(
          {
            ...data,
            userProfile:
              data.userProfile && restrictObjectNulls(data.userProfile, ['id']),
            images: data.images?.map((image) =>
              restrictObjectNulls(image, ['id']),
            ),
          },
          ['roles', 'customer', 'userProfile', 'images'],
        ),
        context,
        query: queryFromInfo({ context, info, path: ['user'] }),
      });
      return { user };
    },
  }),
);

const userUpdateDataInputType = builder.inputType('UserUpdateData', {
  fields: (t) => ({
    name: t.string(),
    email: t.string(),
    roles: t.field({ type: [userEmbeddedRolesDataInputType] }),
    customer: t.field({ type: userEmbeddedCustomerDataInputType }),
    userProfile: t.field({ type: userEmbeddedUserProfileDataInputType }),
    images: t.field({ type: [userEmbeddedImagesDataInputType] }),
  }),
});

builder.mutationField('updateUser', (t) =>
  t.fieldWithInputPayload({
    input: {
      id: t.input.field({ required: true, type: 'Uuid' }),
      data: t.input.field({ required: true, type: userUpdateDataInputType }),
    },
    payload: { user: t.payload.field({ type: userObjectType }) },
    authorize: ['admin'],
    resolve: async (root, { input: { id, data } }, context, info) => {
      const user = await updateUser({
        id,
        data: restrictObjectNulls(
          {
            ...data,
            userProfile:
              data.userProfile && restrictObjectNulls(data.userProfile, ['id']),
            images: data.images?.map((image) =>
              restrictObjectNulls(image, ['id']),
            ),
          },
          ['email', 'roles', 'images'],
        ),
        context,
        query: queryFromInfo({ context, info, path: ['user'] }),
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
        id,
        context,
        query: queryFromInfo({ context, info, path: ['user'] }),
      });
      return { user };
    },
  }),
);
