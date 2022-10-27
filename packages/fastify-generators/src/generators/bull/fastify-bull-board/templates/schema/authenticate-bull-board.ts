// @ts-nocheck

import { createStandardMutation } from '%nexus/utils';
import { createBullBoardAuthCode } from '../services/auth.service';

export const createBullBoardAuthCodeMutation = createStandardMutation({
  name: 'createBullBoardAuthCode',
  payloadDefinition(t) {
    t.nonNull.string('code');
  },
  authorize: ['admin'],
  resolve: async () => {
    const code = await createBullBoardAuthCode();
    return { code };
  },
});
