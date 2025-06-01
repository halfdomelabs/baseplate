// @ts-nocheck

import { builder } from '%pothosImports';

import { userSessionService } from '../services/user-session.service.js';

builder.mutationField('logOut', (t) =>
  t.fieldWithInputPayload({
    payload: {
      success: t.payload.boolean({
        description: 'Whether the logout was successful.',
      }),
    },
    resolve: async (parent, args, context) => {
      if (context.auth.session && context.auth.session.type === 'user') {
        await userSessionService.clearSession(context.auth.session, context);
      }

      return { success: true };
    },
  }),
);
