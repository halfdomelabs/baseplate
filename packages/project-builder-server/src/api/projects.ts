import { z } from 'zod';

import { privateProcedure, router } from './trpc.js';

export type { ProjectInfo } from '@baseplate-dev/project-builder-lib';

export const projectsRouter = router({
  list: privateProcedure.query(({ ctx }) =>
    ctx.serviceManager.getServices().map((service) => service.project),
  ),

  readDefinition: privateProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input: { id }, ctx }) => {
      const api = ctx.getApi(id);
      const contents = await api.readDefinition();
      return { contents };
    }),

  onProjectJsonChanged: privateProcedure
    .input(z.object({ id: z.string() }))
    .subscription(async function* ({ input: { id }, ctx, signal }) {
      for await (const payload of ctx
        .getApi(id)
        .onAsync('project-json-changed', { signal })) {
        yield payload;
      }
    }),

  writeDefinition: privateProcedure
    .input(
      z.object({
        id: z.string(),
        newContents: z.string(),
        oldContentsHash: z.string(),
      }),
    )
    .mutation(async ({ input: { id, newContents, oldContentsHash }, ctx }) => {
      const api = ctx.getApi(id);
      const result = await api.writeDefinition(newContents, oldContentsHash);
      return { result };
    }),
});
