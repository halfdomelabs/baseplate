// @ts-nocheck

import { builder } from '%pothos';
import { createBullBoardAuthCode } from '../services/auth.service';

export const createBullBoardAuthCodeMutation = builder.mutationField(
  'createBullBoardAuthCode',
  (t) =>
    t.fieldWithInputPayload({
      payload: {
        code: t.payload.string(),
      },
      authorize: ['admin'],
      resolve: async () => {
        const code = await createBullBoardAuthCode();
        return { code };
      },
    })
);
