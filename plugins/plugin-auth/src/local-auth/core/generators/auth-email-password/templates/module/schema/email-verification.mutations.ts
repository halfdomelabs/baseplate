// @ts-nocheck

import {
  requestEmailVerification,
  verifyEmail,
} from '$servicesEmailVerification';
import { builder } from '%pothosImports';

builder.mutationField('requestEmailVerification', (t) =>
  t.fieldWithInputPayload({
    authorize: ['user'],
    payload: {
      success: t.payload.field({ type: 'Boolean' }),
    },
    resolve: async (_root, _args, context) =>
      requestEmailVerification({
        userId: context.auth.userIdOrThrow(),
        context,
      }),
  }),
);

builder.mutationField('verifyEmail', (t) =>
  t.fieldWithInputPayload({
    authorize: ['public'],
    payload: {
      success: t.payload.field({ type: 'Boolean' }),
    },
    input: {
      token: t.input.field({ required: true, type: 'String' }),
    },
    resolve: async (_root, { input }, context) =>
      verifyEmail({ token: input.token, context }),
  }),
);
