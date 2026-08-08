import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';
import { packageSyncResultSchema } from '#src/sync/sync-metadata.js';

const syncAllProjectsInputSchema = z.object({
  overwrite: z
    .boolean()
    .optional()
    .describe('Whether to force overwrite existing files and apply snapshot.'),
  skipCommands: z
    .boolean()
    .optional()
    .describe('Whether to skip running commands.'),
});
const syncAllProjectsOutputSchema = z.object({
  overallStatus: z
    .enum(['success', 'partial', 'error'])
    .describe('The overall status of the sync operation across all projects.'),
  message: z.string().describe('Human-readable result summary.'),
  results: z
    .array(
      z.object({
        projectName: z.string().describe('The name of the project.'),
        status: z
          .enum(['success', 'error', 'cancelled'])
          .describe('The status of the sync operation for this project.'),
        message: z.string().describe('Human-readable result message.'),
        packageSyncResults: z
          .record(z.string(), packageSyncResultSchema.optional())
          .optional()
          .describe('The results of the sync for each package.'),
      }),
    )
    .describe('Results for each individual project.'),
});

export const syncAllProjectsMetadata = createServiceActionMetadata({
  name: 'sync-all-projects',
  title: 'Sync All Projects',
  description: 'Sync all non-test projects using the baseplate sync engine',
  inputSchema: syncAllProjectsInputSchema,
  outputSchema: syncAllProjectsOutputSchema,
  scope: 'user',
});
