import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import type { ProjectBuilderService } from '@src/service/builder-service.js';

import type { BaseplateApiContext } from './types.js';

import { privateProcedure, router } from './trpc.js';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createPluginsRouter({ services }: BaseplateApiContext) {
  function getApi(projectId: string): ProjectBuilderService {
    const service = services.find((a) => a.id === projectId);
    if (!service) {
      throw new TRPCError({
        message: `No project with id ${projectId}`,
        code: 'NOT_FOUND',
      });
    }
    return service;
  }

  return router({
    getAvailablePlugins: privateProcedure
      .input(
        z.object({
          projectId: z.string(),
        }),
      )
      .mutation(async ({ input: { projectId } }) => {
        const api = getApi(projectId);

        return api.getAvailablePlugins();
      }),
  });
}
