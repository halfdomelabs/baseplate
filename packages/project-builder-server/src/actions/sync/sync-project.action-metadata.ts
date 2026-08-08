import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';
import { packageSyncResultSchema } from '#src/sync/sync-metadata.js';

const syncProjectInputSchema = z.object({
  project: z.string().describe('The name or ID of the project to sync.'),
  overwrite: z
    .boolean()
    .optional()
    .describe('Whether to force overwrite existing files and apply snapshot.'),
  skipCommands: z
    .boolean()
    .optional()
    .describe('Whether to skip running commands.'),
  baseplateDirectory: z
    .string()
    .optional()
    .describe(
      'Custom baseplate directory for snapshot resolution. Defaults to <projectDirectory>/baseplate.',
    ),
  packages: z
    .array(z.string())
    .optional()
    .describe('Only sync specific packages by name.'),
});
const syncProjectOutputSchema = z.object({
  status: z
    .enum(['success', 'error', 'cancelled'])
    .describe('The status of the sync operation.'),
  packageSyncResults: z
    .record(z.string(), packageSyncResultSchema.optional())
    .optional()
    .describe('The results of the sync for each package.'),
  message: z.string().describe('Human-readable result message.'),
});

export const syncProjectMetadata = createServiceActionMetadata({
  name: 'sync-project',
  title: 'Sync Project',
  description: 'Sync the specified project using the baseplate sync engine',
  inputSchema: syncProjectInputSchema,
  outputSchema: syncProjectOutputSchema,
  scope: 'user',
});
