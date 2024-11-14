import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import type { ProjectBuilderService } from '@src/service/builder-service.js';

import type { BaseplateApiContext } from './types.js';

import { privateProcedure, router } from './trpc.js';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createPluginsRouter({ services }: BaseplateApiContext) {
  function getApi(id: string): ProjectBuilderService {
    const service = services.find((a) => a.id === id);
    if (!service) {
      throw new TRPCError({
        message: `No project with id ${id}`,
        code: 'NOT_FOUND',
      });
    }
    return service;
  }

  return router({
    getAvailablePlugins: privateProcedure
      .input(
        z.object({
          id: z.string(),
        }),
      )
      .mutation(async ({ input: { id } }) => {
        const api = getApi(id);

        return api.getAvailablePlugins();
      }),
  });
}
