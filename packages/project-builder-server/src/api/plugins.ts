import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { privateProcedure, router } from './trpc.js';
import { BaseplateApiContext } from './types.js';
import { ProjectBuilderService } from '@src/service/builder-service.js';

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

        const plugins = await api.getAvailablePlugins();

        return plugins.map((plugin) => ({
          name: plugin.name,
          displayName: plugin.displayName,
          icon: plugin.icon,
          description: plugin.description,
          version: plugin.version,
        }));
      }),
  });
}
