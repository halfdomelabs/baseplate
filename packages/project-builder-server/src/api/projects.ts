import { z } from 'zod';

import { privateProcedure, router } from './trpc.js';

export interface ProjectInfo {
  id: string;
  name: string;
  directory: string;
}

export const projectsRouter = router({
  list: privateProcedure.query(async ({ ctx }) =>
    Promise.all(
      ctx.serviceManager
        .getServices()
        .map(async (service): Promise<ProjectInfo> => {
          const { contents } = await service.readDefinition();
          const parsedContents = JSON.parse(contents) as unknown;

          if (
            !parsedContents ||
            typeof parsedContents !== 'object' ||
            !('name' in parsedContents) ||
            typeof parsedContents.name !== 'string'
          ) {
            throw new Error(
              `Invalid project definition for ${service.directory}`,
            );
          }

          return {
            id: service.id,
            name: parsedContents.name,
            directory: service.directory,
          };
        }),
    ),
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
