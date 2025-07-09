// @ts-nocheck

import { userSessionPayload } from '%authModuleImports';
import { builder } from '%pothosImports';

import {
  authenticateUserWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from '../services/user-password.service.js';

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
      createUserWithEmailAndPassword({
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
