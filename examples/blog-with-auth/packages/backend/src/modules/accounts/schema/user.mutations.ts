import { queryFromInfo } from '@pothos/plugin-prisma';

import { builder } from '@src/plugins/graphql/builder.js';
import { restrictObjectNulls } from '@src/utils/nulls.js';

import { createUser, deleteUser, updateUser } from '../services/user.crud.js';
import { userObjectType } from './user.object-type.js';

const userCreateDataInputType = builder.inputType('UserCreateData', {
  fields: (t) => ({
    name: t.string(),
    emailVerified: t.boolean(),
    email: t.string(),
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
        data: restrictObjectNulls(data, ['emailVerified']),
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
    emailVerified: t.boolean(),
    email: t.string(),
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
        data: restrictObjectNulls(data, ['emailVerified']),
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
