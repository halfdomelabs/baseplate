import { z } from 'zod';

import { privateProcedure, router } from './trpc.js';

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

  onConsoleEmitted: privateProcedure
    .input(z.object({ id: z.string() }))
    .subscription(async function* ({ input: { id }, ctx, signal }) {
      for await (const payload of ctx
        .getApi(id)
        .onAsync('command-console-emitted', { signal })) {
        yield payload;
      }
    }),

  getCurrentSyncConsoleOutput: privateProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input: { id }, ctx }) =>
      ctx.getApi(id).getCurrentSyncConsoleOutput(),
    ),

  onSyncMetadataChanged: privateProcedure
    .input(z.object({ id: z.string() }))
    .subscription(async function* ({ input: { id }, ctx, signal }) {
      for await (const payload of ctx
        .getApi(id)
        .onAsync('sync-metadata-changed', { signal })) {
        yield payload;
      }
    }),

  getSyncMetadata: privateProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input: { id }, ctx }) => ctx.getApi(id).getSyncMetadata()),

  onSyncStarted: privateProcedure
    .input(z.object({ id: z.string() }))
    .subscription(async function* ({ input: { id }, ctx, signal }) {
      for await (const payload of ctx
        .getApi(id)
        .onAsync('sync-started', { signal })) {
        yield payload;
      }
    }),

  onSyncCompleted: privateProcedure
    .input(z.object({ id: z.string() }))
    .subscription(async function* ({ input: { id }, ctx, signal }) {
      for await (const payload of ctx
        .getApi(id)
        .onAsync('sync-completed', { signal })) {
        yield payload;
      }
    }),

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
