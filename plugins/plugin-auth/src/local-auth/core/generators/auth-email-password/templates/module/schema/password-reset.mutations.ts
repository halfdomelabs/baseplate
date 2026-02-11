// @ts-nocheck

import {
  completePasswordReset,
  requestPasswordReset,
  validatePasswordResetToken,
} from '$servicesPasswordReset';
import { builder } from '%pothosImports';

builder.mutationField('requestPasswordReset', (t) =>
  t.fieldWithInputPayload({
    authorize: ['public'],
    payload: {
      success: t.payload.field({ type: 'Boolean' }),
    },
    input: {
      email: t.input.field({ required: true, type: 'String' }),
    },
    resolve: async (_root, { input }, context) =>
      requestPasswordReset({ email: input.email, context }),
  }),
);

builder.mutationField('validatePasswordResetToken', (t) =>
  t.fieldWithInputPayload({
    authorize: ['public'],
    payload: {
      valid: t.payload.field({ type: 'Boolean' }),
    },
    input: {
      token: t.input.field({ required: true, type: 'String' }),
    },
    resolve: async (_root, { input }) =>
      validatePasswordResetToken({ token: input.token }),
  }),
);

builder.mutationField('resetPasswordWithToken', (t) =>
  t.fieldWithInputPayload({
    authorize: ['public'],
    payload: {
      success: t.payload.field({ type: 'Boolean' }),
    },
    input: {
      token: t.input.field({ required: true, type: 'String' }),
      newPassword: t.input.field({ required: true, type: 'String' }),
    },
    resolve: async (_root, { input }) =>
      completePasswordReset({
        token: input.token,
        newPassword: input.newPassword,
      }),
  }),
);
