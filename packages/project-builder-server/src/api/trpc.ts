import { initTRPC } from '@trpc/server';

import { UserVisibleError } from '#src/utils/errors.js';

import type { Context } from './context.js';

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
    const { host, origin } = opts.ctx.req.headers;

    const allowedHosts = [
      `localhost:${opts.ctx.serverPort}`,
      `127.0.0.1:${opts.ctx.serverPort}`,
      `[::1]:${opts.ctx.serverPort}`,
    ];
    const allowedOrigins = new Set(
      allowedHosts.map((host) => `http://${host}`),
    );

    if (opts.type === 'query' || opts.type === 'subscription') {
      // We check host to avoid DNS rebinding attacks.
      if (!allowedHosts.includes(host ?? '')) {
        throw new Error(`Blocked: invalid host ${host ?? 'unknown'}`);
      }
    } else {
      // We check origin to avoid CORS attacks.
      if (!allowedOrigins.has(origin ?? '')) {
        throw new Error(`Blocked: invalid origin ${origin ?? 'unknown'}`);
      }
    }

    return opts.next();
  }),
);
