import { builder } from '@src/plugins/graphql/builder.js';

import { userSessionPayload } from '../../schema/user-session-payload.object-type.js';
import { userObjectType } from '../../schema/user.object-type.js';
import {
  authenticateUserWithEmailAndPassword,
  changeUserPassword,
  registerUserWithEmailAndPassword,
  resetUserPassword,
} from '../services/user-password.service.js';

builder.mutationField('registerWithEmailPassword', (t) =>
  t.fieldWithInputPayload({
    authorize: ['public'],
    payload: {
      session: t.payload.field({ type: userSessionPayload }),
    },
    input: {
      email: t.input.field({ required: true, type: 'String' }),
      password: t.input.field({ required: true, type: 'String' }),
    },
    resolve: async (root, { input }, context) =>
      registerUserWithEmailAndPassword({
        input,
        context,
      }),
  }),
);

builder.mutationField('loginWithEmailPassword', (t) =>
  t.fieldWithInputPayload({
    authorize: ['public'],
    payload: {
      session: t.payload.field({ type: userSessionPayload }),
    },
    input: {
      email: t.input.field({ required: true, type: 'String' }),
      password: t.input.field({ required: true, type: 'String' }),
    },
    resolve: async (root, { input }, context) =>
      authenticateUserWithEmailAndPassword({
        input,
        context,
      }),
  }),
);

builder.mutationField('changePassword', (t) =>
  t.fieldWithInputPayload({
    authorize: ['user'],
    payload: {
      user: t.payload.field({
        type: /* TPL_USER_OBJECT_TYPE:START */ userObjectType /* TPL_USER_OBJECT_TYPE:END */,
      }),
    },
    input: {
      currentPassword: t.input.field({ required: true, type: 'String' }),
      newPassword: t.input.field({ required: true, type: 'String' }),
    },
    resolve: async (_root, { input }, context) => {
      const userId = context.auth.userIdOrThrow();
      const user = await changeUserPassword({
        userId,
        input,
      });
      return { user };
    },
  }),
);

builder.mutationField('resetUserPassword', (t) =>
  t.fieldWithInputPayload({
    authorize: /* TPL_ADMIN_ROLES:START */ ['admin'] /* TPL_ADMIN_ROLES:END */,
    payload: {
      user: t.payload.field({
        type: /* TPL_USER_OBJECT_TYPE:START */ userObjectType /* TPL_USER_OBJECT_TYPE:END */,
      }),
    },
    input: {
      userId: t.input.field({ required: true, type: 'Uuid' }),
      newPassword: t.input.field({ required: true, type: 'String' }),
    },
    resolve: async (_root, { input }) => {
      const user = await resetUserPassword({
        userId: input.userId,
        input: { newPassword: input.newPassword },
      });
      return { user };
    },
  }),
);
