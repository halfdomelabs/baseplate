import { builder } from '@src/plugins/graphql/builder.js';

import {
  requestEmailVerification,
  verifyEmail,
} from '../services/email-verification.service.js';

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
    resolve: async (_root, { input }) => verifyEmail({ token: input.token }),
  }),
);
