import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

const syncFileInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  app: z.string().describe('The app name within the project.'),
  files: z
    .array(z.string())
    .describe(
      'Array of glob patterns to match files to sync (e.g., "src/routes/**/*.ts").',
    ),
});
const syncFileOutputSchema = z.object({
  success: z.boolean().describe('Whether the operation was successful.'),
  message: z.string().describe('Result message.'),
  filesApplied: z
    .array(z.string())
    .describe('List of files that were successfully applied.'),
  errors: z.array(z.string()).describe('List of errors encountered.'),
});

export const syncFileMetadata = createServiceActionMetadata({
  name: 'sync-file',
  title: 'Sync Specific Files',
  description:
    'Apply specific generated files to the working codebase without performing a full sync',
  inputSchema: syncFileInputSchema,
  outputSchema: syncFileOutputSchema,
  scope: 'user',
});
