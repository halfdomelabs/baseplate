// @ts-nocheck

import {
  authenticateUserWithEmailAndPassword,
  registerUserWithEmailAndPassword,
} from '$servicesUserPassword';
import { userSessionPayload } from '%authModuleImports';
import { builder } from '%pothosImports';

builder.mutationField('registerWithEmailPassword', (t) =>
  t.fieldWithInputPayload({
    authorize: ['public'],
    payload: {
      session: t.payload.field({ type: userSessionPayload }),
    },
    input: {
      email: t.input.field({ required: true, type: 'String' }),
      password: t.input.field({ required: true, type: 'String' }),
    },
    resolve: async (root, { input }, context) =>
      registerUserWithEmailAndPassword({
        input,
        context,
      }),
  }),
);

builder.mutationField('loginWithEmailPassword', (t) =>
  t.fieldWithInputPayload({
    authorize: ['public'],
    payload: {
      session: t.payload.field({ type: userSessionPayload }),
    },
    input: {
      email: t.input.field({ required: true, type: 'String' }),
      password: t.input.field({ required: true, type: 'String' }),
    },
    resolve: async (root, { input }, context) =>
      authenticateUserWithEmailAndPassword({
        input,
        context,
      }),
  }),
);
