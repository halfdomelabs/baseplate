import { observable } from '@trpc/server/observable';
import { z } from 'zod';

import type { CommandConsoleEmittedPayload } from '@src/service/builder-service.js';
import type { SyncMetadata } from '@src/sync/index.js';

import { privateProcedure, router, websocketProcedure } from './trpc.js';

export const syncRouter = router({
  startSync: privateProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(({ input: { id }, ctx }) => {
      const api = ctx.getApi(id);

      api.buildProject().catch((error: unknown) => {
        ctx.logger.error(error);
      });

      return { success: true };
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

  onSyncMetadataChanged: websocketProcedure
    .input(z.object({ id: z.string() }))
    .subscription(({ input: { id }, ctx }) =>
      observable<SyncMetadata>((emit) => {
        const unsubscribe = ctx
          .getApi(id)
          .on('sync-metadata-changed', (payload) => {
            emit.next(payload);
          });
        return () => {
          unsubscribe();
        };
      }),
    ),

  getSyncMetadata: privateProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input: { id }, ctx }) => ctx.getApi(id).getSyncMetadata()),
});
