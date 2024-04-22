import { ProjectDefinition } from '@halfdomelabs/project-builder-lib';
import { TRPCError } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import { z } from 'zod';

import { privateProcedure, router, websocketProcedure } from './trpc.js';
import { BaseplateApiContext } from './types.js';
import {
  FilePayload,
  ProjectBuilderService,
} from '@src/service/builder-service.js';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createProjectsRouter({ services }: BaseplateApiContext) {
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
    list: privateProcedure.query(async () => {
      return Promise.all(
        services.map(async (service) => {
          const config = await service.readConfig();
          if (!config) {
            throw new Error(`File config missing for ${service.directory}`);
          }
          const parsedContents = JSON.parse(
            config.contents,
          ) as ProjectDefinition;
          return {
            id: service.id,
            name: parsedContents.name,
            directory: service.directory,
          };
        }),
      );
    }),

    get: privateProcedure
      .input(
        z.object({
          id: z.string(),
        }),
      )
      .query(async ({ input: { id } }) => {
        const api = getApi(id);
        const file = await api.readConfig();
        return { file };
      }),

    onProjectJsonChanged: websocketProcedure
      .input(z.object({ id: z.string() }))
      .subscription(({ input: { id } }) => {
        return observable<FilePayload | null>((emit) => {
          const unsubscribe = getApi(id).on(
            'project-json-changed',
            (payload) => {
              emit.next(payload);
            },
          );
          return () => unsubscribe();
        });
      }),

    writeConfig: privateProcedure
      .input(
        z.object({
          id: z.string(),
          contents: z.string(),
          lastModifiedAt: z.string(),
        }),
      )
      .mutation(async ({ input: { id, contents, lastModifiedAt } }) => {
        const api = getApi(id);
        const result = await api.writeConfig({ contents, lastModifiedAt });
        return { result };
      }),
  });
}
