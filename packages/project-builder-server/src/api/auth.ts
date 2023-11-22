import { TRPCError } from '@trpc/server';

import { getCsrfToken } from './crsf.js';
import { publicProcedure, router } from './trpc.js';

export const authRouter = router({
  getCsrfToken: publicProcedure.query(({ ctx: { req } }) => {
    // DNS rebinding attack prevention
    const host = req.headers.host ?? '';
    if (
      !host.startsWith('localhost:') &&
      host !== 'localhost' &&
      !host.startsWith('127.0.0.1') &&
      host !== '127.0.0.1'
    ) {
      throw new TRPCError({
        message: `Must connect from localhost`,
        code: 'UNAUTHORIZED',
      });
    }

    return getCsrfToken();
  }),
});
