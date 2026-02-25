import { queryFromInfo } from '@pothos/plugin-prisma';

import { builder } from '@src/plugins/graphql/builder.js';

import {
  createUser,
  deleteUser,
  updateUser,
  userCreateSchema,
  userUpdateSchema,
} from '../services/user.data-service.js';
import { userObjectType } from './user.object-type.js';

const createUserDataInputType = builder
  .inputType('CreateUserData', {
    fields: (t) => ({
      email: t.string(),
      name: t.string(),
      emailVerified: t.boolean(),
    }),
  })
  .validate(userCreateSchema);

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
      });
      return { user };
    },
  }),
);

const updateUserDataInputType = builder
  .inputType('UpdateUserData', {
    fields: (t) => ({
      email: t.string(),
      name: t.string(),
      emailVerified: t.boolean(),
    }),
  })
  .validate(userUpdateSchema);

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
