// @ts-nocheck

import { resetUserPassword, updateUserRoles } from '$adminAuthService';
import { builder } from '%pothosImports';

builder.mutationField('resetUserPassword', (t) =>
  t.fieldWithInputPayload({
    authorize: TPL_ADMIN_ROLES,
    payload: {
      user: t.payload.field({
        type: TPL_USER_OBJECT_TYPE,
      }),
    },
    input: {
      userId: t.input.field({ required: true, type: 'Uuid' }),
      newPassword: t.input.field({ required: true, type: 'String' }),
    },
    resolve: async (_root, { input }) => {
      const user = await resetUserPassword({
        userId: input.userId,
        newPassword: input.newPassword,
      });
      return { user };
    },
  }),
);

builder.mutationField('updateUserRoles', (t) =>
  t.fieldWithInputPayload({
    authorize: TPL_ADMIN_ROLES,
    payload: {
      user: t.payload.field({
        type: TPL_USER_OBJECT_TYPE,
      }),
    },
    input: {
      userId: t.input.field({ required: true, type: 'Uuid' }),
      roles: t.input.field({
        required: true,
        type: ['String'],
      }),
    },
    resolve: async (root, { input }) => {
      const user = await updateUserRoles(input);
      return { user };
    },
  }),
);
