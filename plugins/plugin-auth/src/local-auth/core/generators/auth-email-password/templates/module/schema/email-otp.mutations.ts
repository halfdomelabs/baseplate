// @ts-nocheck

import { requestEmailOtp, signInWithEmailOtp } from '$servicesEmailOtp';
import { userSessionPayload } from '%authModuleImports';
import { builder } from '%pothosImports';

builder.mutationField('requestEmailOtp', (t) =>
  t.fieldWithInputPayload({
    authorize: ['public'],
    payload: {
      success: t.payload.field({ type: 'Boolean' }),
    },
    input: {
      email: t.input.field({ required: true, type: 'String' }),
    },
    resolve: async (root, { input }, context) =>
      requestEmailOtp({ email: input.email, context }),
  }),
);

builder.mutationField('signInWithEmailOtp', (t) =>
  t.fieldWithInputPayload({
    authorize: ['public'],
    payload: {
      session: t.payload.field({ type: userSessionPayload }),
    },
    input: {
      email: t.input.field({ required: true, type: 'String' }),
      code: t.input.field({ required: true, type: 'String' }),
      name: t.input.field({ required: false, type: 'String' }),
    },
    resolve: async (root, { input }, context) =>
      signInWithEmailOtp({
        input: { ...input, name: input.name ?? undefined },
        context,
      }),
  }),
);
