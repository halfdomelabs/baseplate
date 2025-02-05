import { observable } from '@trpc/server/observable';
import { z } from 'zod';

import type {
  CommandConsoleEmittedPayload,
  WriteResult,
} from '@src/service/builder-service.js';

import { privateProcedure, router, websocketProcedure } from './trpc.js';

export const syncRouter = router({
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
    .mutation(async ({ input: { id, payload }, ctx }) => {
      const api = ctx.getApi(id);
      let writeResult: WriteResult | null = null;

      if (payload) {
        writeResult = await api.writeConfig(payload);
      }

      api.buildProject().catch((error: unknown) => {
        ctx.logger.error(error);
      });

      return { success: true, writeResult };
    }),

  onConsoleEmitted: websocketProcedure
    .input(z.object({ id: z.string() }))
    .subscription(({ input: { id }, ctx }) =>
      observable<CommandConsoleEmittedPayload>((emit) => {
        const unsubscribe = ctx
          .getApi(id)
          .on('command-console-emitted', (payload) => {
            emit.next(payload);
          });
        return () => {
          unsubscribe();
        };
      }),
    ),
});
