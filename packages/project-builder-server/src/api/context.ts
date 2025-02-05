import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';

import { TRPCError } from '@trpc/server';

import type { BaseplateApiContext } from './types.js';

export function createContextBuilder(apiContext: BaseplateApiContext) {
  return function createContext({ req, res }: CreateFastifyContextOptions) {
    return {
      req,
      res,
      ...apiContext,
      getApi: (projectId: string) => {
        const service = apiContext.services.find((a) => a.id === projectId);
        if (!service) {
          throw new TRPCError({
            message: `No project with id ${projectId}`,
            code: 'NOT_FOUND',
          });
        }
        return service;
      },
    };
  };
}

export type Context = Awaited<
  ReturnType<ReturnType<typeof createContextBuilder>>
>;
