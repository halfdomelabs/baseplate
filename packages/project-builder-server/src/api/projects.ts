import { observable } from '@trpc/server/observable';
import { z } from 'zod';

import type { ProjectDefinitionFilePayload } from '@src/service/builder-service.js';

import { privateProcedure, router, websocketProcedure } from './trpc.js';

export interface ProjectInfo {
  id: string;
  name: string;
  directory: string;
}

export const projectsRouter = router({
  list: privateProcedure.query(async ({ ctx }) =>
    Promise.all(
      ctx.services.map(async (service): Promise<ProjectInfo> => {
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

  onProjectJsonChanged: websocketProcedure
    .input(z.object({ id: z.string() }))
    .subscription(({ input: { id }, ctx }) =>
      observable<ProjectDefinitionFilePayload>((emit) => {
        const unsubscribe = ctx
          .getApi(id)
          .on('project-json-changed', (payload) => {
            emit.next(payload);
          });
        return () => {
          unsubscribe();
        };
      }),
    ),

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
