import { observable } from '@trpc/server/observable';
import { z } from 'zod';

import type { FilePayload } from '@src/service/builder-service.js';

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
        const config = await service.readConfig();
        if (!config) {
          throw new Error(`File config missing for ${service.directory}`);
        }
        const parsedContents = JSON.parse(config.contents) as unknown;

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

  get: privateProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input: { id }, ctx }) => {
      const api = ctx.getApi(id);
      const file = await api.readConfig();
      return { file };
    }),

  onProjectJsonChanged: websocketProcedure
    .input(z.object({ id: z.string() }))
    .subscription(({ input: { id }, ctx }) =>
      observable<FilePayload | undefined>((emit) => {
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

  writeConfig: privateProcedure
    .input(
      z.object({
        id: z.string(),
        contents: z.string(),
        lastModifiedAt: z.string(),
      }),
    )
    .mutation(async ({ input: { id, contents, lastModifiedAt }, ctx }) => {
      const api = ctx.getApi(id);
      const result = await api.writeConfig({ contents, lastModifiedAt });
      return { result };
    }),
});
