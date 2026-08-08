import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

const snapshotAddInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  app: z.string().describe('The app name within the project.'),
  files: z
    .array(z.string())
    .describe('Array of file paths to add to snapshot.'),
  deleted: z
    .boolean()
    .optional()
    .describe('Mark files as intentionally deleted in snapshot.'),
});
const snapshotAddOutputSchema = z.object({
  success: z
    .boolean()
    .describe('Whether the snapshot add operation was successful.'),
  message: z.string().describe('Result message.'),
  filesAdded: z.number().describe('Number of files added to the snapshot.'),
});

export const snapshotAddMetadata = createServiceActionMetadata({
  name: 'snapshot-add',
  title: 'Add Files to Snapshot',
  description: 'Add files to snapshot for persistent differences tracking',
  inputSchema: snapshotAddInputSchema,
  outputSchema: snapshotAddOutputSchema,
  scope: 'dev',
});
