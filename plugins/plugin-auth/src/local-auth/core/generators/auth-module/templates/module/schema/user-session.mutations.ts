// @ts-nocheck

import { userSessionService } from '$userSessionService';
import { builder } from '%pothosImports';

builder.mutationField('logOut', (t) =>
  t.fieldWithInputPayload({
    authorize: ['public'],
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
