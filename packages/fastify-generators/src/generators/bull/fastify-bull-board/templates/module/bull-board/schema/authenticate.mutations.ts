// @ts-nocheck

import { createBullBoardAuthCode } from '$servicesAuthService';
import { builder } from '%pothosImports';

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
