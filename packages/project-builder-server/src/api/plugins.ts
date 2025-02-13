import { z } from 'zod';

import { privateProcedure, router } from './trpc.js';

export const pluginsRouter = router({
  getAvailablePlugins: privateProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .mutation(async ({ input: { projectId }, ctx }) => {
      const api = ctx.getApi(projectId);

      return api.getAvailablePlugins();
    }),
});
