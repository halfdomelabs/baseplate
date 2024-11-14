import { TRPCError } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import { z } from 'zod';

import type {
  CommandConsoleEmittedPayload,
  ProjectBuilderService,
  WriteResult,
} from '@src/service/builder-service.js';

import type { BaseplateApiContext } from './types.js';

import { privateProcedure, router, websocketProcedure } from './trpc.js';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createSyncRouter({ services, logger }: BaseplateApiContext) {
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
    startSync: privateProcedure
      .input(
        z.object({
          id: z.string(),
          payload: z
            .object({
              contents: z.string(),
              lastModifiedAt: z.string(),
            })
            .optional(),
        }),
      )
      .mutation(async ({ input: { id, payload } }) => {
        const api = getApi(id);
        let writeResult: WriteResult | null = null;

        if (payload) {
          writeResult = await api.writeConfig(payload);
        }

        api.buildProject().catch((error: unknown) => {
          logger.error(error);
        });

        return { success: true, writeResult };
      }),

    onConsoleEmitted: websocketProcedure
      .input(z.object({ id: z.string() }))
      .subscription(({ input: { id } }) =>
        observable<CommandConsoleEmittedPayload>((emit) => {
          const unsubscribe = getApi(id).on(
            'command-console-emitted',
            (payload) => {
              emit.next(payload);
            },
          );
          return () => {
            unsubscribe();
          };
        }),
      ),
  });
}
