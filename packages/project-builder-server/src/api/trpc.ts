import { initTRPC, TRPCError } from '@trpc/server';

import { UserVisibleError } from '@src/utils/errors.js';

import type { Context } from './context.js';

import { getCsrfToken } from './crsf.js';

const t = initTRPC.context<Context>().create({
  errorFormatter({ error, shape }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        isUserVisible: error instanceof UserVisibleError,
        descriptionText:
          error instanceof UserVisibleError ? error.descriptionText : undefined,
      },
    };
  },
});

export const { router } = t;
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

export const websocketProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const input = opts.rawInput as { csrfToken?: string };
    const headerCsrfToken = input.csrfToken;
    const csrfToken = getCsrfToken();

    if (headerCsrfToken !== csrfToken) {
      throw new TRPCError({
        message: `Invalid CSRF token`,
        code: 'FORBIDDEN',
      });
    }

    delete input.csrfToken;

    return opts.next();
  }),
);
