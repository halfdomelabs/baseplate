import { builder } from '@src/plugins/graphql/builder.js';

import { createBullBoardAuthCode } from '../services/auth.service.js';

builder.mutationField('createBullBoardAuthCode', (t) =>
  t.fieldWithInputPayload({
    payload: {
      code: t.payload.string(),
    },
    authorize: ['admin'],
    resolve: async () => {
      const code = await createBullBoardAuthCode();
      return { code };
    },
  }),
);
