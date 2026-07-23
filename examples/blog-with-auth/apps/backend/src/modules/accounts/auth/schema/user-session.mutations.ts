import { builder } from '@src/plugins/graphql/builder.js';

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
        await context.services.userSession.clearSession(
          context.auth.session,
          context,
        );
      }

      return { success: true };
    },
  }),
);
