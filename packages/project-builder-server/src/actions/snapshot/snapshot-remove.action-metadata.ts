import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

const snapshotRemoveInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  app: z.string().describe('The app name within the project.'),
  files: z
    .array(z.string())
    .describe('Array of file paths to remove from snapshot.'),
});
const snapshotRemoveOutputSchema = z.object({
  success: z
    .boolean()
    .describe('Whether the snapshot remove operation was successful.'),
  message: z.string().describe('Result message.'),
  filesRemoved: z
    .number()
    .describe('Number of files removed from the snapshot.'),
});

export const snapshotRemoveMetadata = createServiceActionMetadata({
  name: 'snapshot-remove',
  title: 'Remove Files from Snapshot',
  description: 'Remove files from snapshot tracking',
  inputSchema: snapshotRemoveInputSchema,
  outputSchema: snapshotRemoveOutputSchema,
  scope: 'dev',
});
