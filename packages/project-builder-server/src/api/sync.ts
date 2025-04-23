import { observable } from '@trpc/server/observable';
import { z } from 'zod';

import type {
  CommandConsoleEmittedPayload,
  SyncCompletedPayload,
  SyncMetadataChangedPayload,
  SyncStartedPayload,
} from '@src/service/builder-service.js';

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

  cancelSync: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input: { id }, ctx }) => {
      ctx.getApi(id).cancelSync();
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

  getCurrentSyncConsoleOutput: privateProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input: { id }, ctx }) =>
      ctx.getApi(id).getCurrentSyncConsoleOutput(),
    ),

  onSyncMetadataChanged: websocketProcedure
    .input(z.object({ id: z.string() }))
    .subscription(({ input: { id }, ctx }) =>
      observable<SyncMetadataChangedPayload>((emit) => {
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

  onSyncStarted: websocketProcedure
    .input(z.object({ id: z.string() }))
    .subscription(({ input: { id }, ctx }) =>
      observable<SyncStartedPayload>((emit) => {
        const unsubscribe = ctx.getApi(id).on('sync-started', (payload) => {
          emit.next(payload);
        });
        return () => {
          unsubscribe();
        };
      }),
    ),

  onSyncCompleted: websocketProcedure
    .input(z.object({ id: z.string() }))
    .subscription(({ input: { id }, ctx }) =>
      observable<SyncCompletedPayload>((emit) => {
        const unsubscribe = ctx.getApi(id).on('sync-completed', (payload) => {
          emit.next(payload);
        });
        return () => {
          unsubscribe();
        };
      }),
    ),

  openEditor: privateProcedure
    .input(
      z.object({
        id: z.string(),
        packageId: z.string(),
        relativePath: z.string(),
      }),
    )
    .mutation(async ({ input: { id, packageId, relativePath }, ctx }) => {
      await ctx.getApi(id).openEditor(packageId, relativePath);
    }),

  deleteConflictFile: privateProcedure
    .input(
      z.object({
        id: z.string(),
        packageId: z.string(),
        relativePath: z.string(),
      }),
    )
    .mutation(async ({ input: { id, packageId, relativePath }, ctx }) => {
      await ctx.getApi(id).deleteConflictFile(packageId, relativePath);
    }),

  keepConflictFile: privateProcedure
    .input(
      z.object({
        id: z.string(),
        packageId: z.string(),
        relativePath: z.string(),
      }),
    )
    .mutation(async ({ input: { id, packageId, relativePath }, ctx }) => {
      await ctx.getApi(id).keepConflictFile(packageId, relativePath);
    }),
});
