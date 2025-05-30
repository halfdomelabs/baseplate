import { z } from 'zod';

import { privateProcedure, router } from './trpc.js';

export interface ProjectInfo {
  id: string;
  name: string;
  directory: string;
}

const simpleProjectDefinitionSchema = z.object({
  // handle old placement of name
  name: z.string().optional(),
  settings: z
    .object({
      general: z.object({
        name: z.string(),
      }),
    })
    .optional(),
});

export const projectsRouter = router({
  list: privateProcedure.query(async ({ ctx }) =>
    Promise.all(
      ctx.serviceManager
        .getServices()
        .map(async (service): Promise<ProjectInfo> => {
          const { contents } = await service.readDefinition();
          const parseResult = simpleProjectDefinitionSchema.safeParse(
            JSON.parse(contents) as unknown,
          );

          if (!parseResult.success) {
            throw new Error(
              `Invalid project definition for ${service.directory}: ${parseResult.error.message}`,
            );
          }

          const parsedContents = parseResult.data;

          const name =
            parsedContents.name ?? parsedContents.settings?.general.name;
          if (!name) {
            throw new Error(
              `Invalid project definition for ${service.directory}: name is required`,
            );
          }

          return {
            id: service.id,
            name,
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
