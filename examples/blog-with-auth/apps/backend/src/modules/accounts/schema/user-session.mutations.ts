import { builder } from '@src/plugins/graphql/builder.js';

import { userSessionService } from '../services/user-session.service.js';

builder.mutationField('logOut', (t) =>
  t.fieldWithInputPayload({
    authorize: ['public'],
    payload: {
      success: t.payload.boolean({
        description: 'Whether the logout was successful.',
      }),
    },
    resolve: async (parent, args, context) => {
      if (context.auth.session?.type === 'user') {
        await userSessionService.clearSession(context.auth.session, context);
      }

      return { success: true };
    },
  }),
);
