import { builder } from '@src/plugins/graphql/builder.js';

import { userObjectType } from '../../users/schema/user.object-type.js';
import {
  resetUserPassword,
  updateUserRoles,
} from '../services/admin-auth.service.js';

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
        newPassword: input.newPassword,
      });
      return { user };
    },
  }),
);

builder.mutationField('updateUserRoles', (t) =>
  t.fieldWithInputPayload({
    authorize: /* TPL_ADMIN_ROLES:START */ ['admin'] /* TPL_ADMIN_ROLES:END */,
    payload: {
      user: t.payload.field({
        type: /* TPL_USER_OBJECT_TYPE:START */ userObjectType /* TPL_USER_OBJECT_TYPE:END */,
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
