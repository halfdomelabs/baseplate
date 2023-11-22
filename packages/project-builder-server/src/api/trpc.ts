import { TRPCError, initTRPC } from '@trpc/server';

import { Context } from './context.js';
import { getCsrfToken } from './crsf.js';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const privateProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const headerCsrfToken = opts.ctx.req.headers['x-csrf-token'];
    const csrfToken = getCsrfToken();

    if (headerCsrfToken !== csrfToken) {
      throw new TRPCError({
        message: `Invalid CSRF token`,
        code: 'FORBIDDEN',
      });
    }
    return opts.next();
  }),
);
