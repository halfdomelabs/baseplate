// @ts-nocheck

import { acceptInvite, inviteUser, validateInviteToken } from '$servicesInvite';
import { userSessionPayload } from '%authModuleImports';
import { builder } from '%pothosImports';

builder.mutationField('inviteUser', (t) =>
  t.fieldWithInputPayload({
    authorize: TPL_ADMIN_ROLES,
    payload: {
      user: t.payload.field({
        type: TPL_USER_OBJECT_TYPE,
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
