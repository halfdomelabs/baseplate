import { z } from 'zod';

const packageSyncStatusSchema = z.enum([
  // The package has not been synced yet
  'not-synced',
  // The package was synced successfully
  'success',
  // The package failed to sync for unknown errors
  'unknown-error',
  // The package has conflicts
  'conflicts',
  // The sync failed to run a post-write command
  'command-error',
  // The sync was cancelled
  'cancelled',
]);

export type PackageSyncStatus = z.infer<typeof packageSyncStatusSchema>;

export const packageSyncResultSchema = z.object({
  filesWithConflicts: z
    .array(
      z.object({
        relativePath: z.string(),
        resolved: z.boolean(),
      }),
    )
    .optional(),
  filesPendingDelete: z
    .array(
      z.object({
        relativePath: z.string(),
        resolved: z.boolean(),
      }),
    )
    .optional(),
  errors: z
    .array(
      z.object({
        message: z.string(),
        stack: z.string().optional(),
      }),
    )
    .optional(),
  failedCommands: z
    .array(
      z.object({
        id: z.string(),
        command: z.string(),
        workingDir: z.string().optional(),
        output: z.string().optional(),
      }),
    )
    .optional(),
});

export type PackageSyncResult = z.infer<typeof packageSyncResultSchema>;

export const packageSyncInfoSchema = z.object({
  name: z.string(),
  path: z.string(),
  status: packageSyncStatusSchema,
  statusMessage: z.string().optional(),
  result: packageSyncResultSchema.optional(),
});

export type PackageSyncInfo = z.infer<typeof packageSyncInfoSchema>;

export const syncMetadataSchema = z.object({
  lastSyncResult: z
    .object({
      status: z.enum(['success', 'error', 'cancelled']),
      timestamp: z.string(),
      projectJsonHash: z.string(),
    })
    .optional(),
  packages: z.record(z.string(), packageSyncInfoSchema),
});

export type SyncMetadata = z.output<typeof syncMetadataSchema>;
