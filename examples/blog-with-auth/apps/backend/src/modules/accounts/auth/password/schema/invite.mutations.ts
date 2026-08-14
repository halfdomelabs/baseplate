import { builder } from '@src/plugins/graphql/builder.js';

import { userObjectType } from '../../../users/schema/user.object-type.js';
import { userSessionPayload } from '../../schema/user-session-payload.object-type.js';
import {
  acceptInvite,
  inviteUser,
  validateInviteToken,
} from '../services/invite.service.js';

builder.mutationField('inviteUser', (t) =>
  t.fieldWithInputPayload({
    authorize: /* TPL_ADMIN_ROLES:START */ ['admin'] /* TPL_ADMIN_ROLES:END */,
    payload: {
      user: t.payload.field({
        type: /* TPL_USER_OBJECT_TYPE:START */ userObjectType /* TPL_USER_OBJECT_TYPE:END */,
      }),
    },
    input: {
      userId: t.input.field({ required: true, type: 'Uuid' }),
    },
    resolve: async (_root, { input }, context) =>
      inviteUser({ userId: input.userId, context }),
  }),
);

builder.mutationField('validateInviteToken', (t) =>
  t.fieldWithInputPayload({
    authorize: ['public'],
    payload: {
      email: t.payload.field({ type: 'String' }),
    },
    input: {
      token: t.input.field({ required: true, type: 'String' }),
    },
    resolve: async (_root, { input }) =>
      validateInviteToken({ token: input.token }),
  }),
);

builder.mutationField('acceptInvite', (t) =>
  t.fieldWithInputPayload({
    authorize: ['public'],
    payload: {
      session: t.payload.field({ type: userSessionPayload }),
    },
    input: {
      token: t.input.field({ required: true, type: 'String' }),
      newPassword: t.input.field({ required: true, type: 'String' }),
    },
    resolve: async (_root, { input }, context) =>
      acceptInvite({
        token: input.token,
        newPassword: input.newPassword,
        context,
      }),
  }),
);
