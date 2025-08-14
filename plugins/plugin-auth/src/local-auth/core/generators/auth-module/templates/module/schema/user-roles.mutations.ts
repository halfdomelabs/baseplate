// @ts-nocheck

import { updateUserRoles } from '$userRolesService';
import { builder } from '%pothosImports';

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
