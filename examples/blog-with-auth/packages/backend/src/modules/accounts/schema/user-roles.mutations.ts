import { builder } from '@src/plugins/graphql/builder.js';

import { updateUserRoles } from '../services/user-roles.service.js';
import { userObjectType } from './user.object-type.js';

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
