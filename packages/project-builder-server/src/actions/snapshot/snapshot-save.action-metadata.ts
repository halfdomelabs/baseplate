import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

const snapshotSaveInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  app: z
    .string()
    .optional()
    .describe(
      'The app name within the project. If omitted, saves snapshots for all apps.',
    ),
  force: z
    .boolean()
    .optional()
    .describe('Skip confirmation prompt and force save snapshot.'),
});
const snapshotSaveOutputSchema = z.object({
  success: z
    .boolean()
    .describe('Whether the snapshot save operation was successful.'),
  message: z.string().describe('Result message.'),
  snapshotPath: z.string().optional().describe('Path to the saved snapshot.'),
  savedApps: z
    .array(z.string())
    .optional()
    .describe('List of app names that had snapshots saved.'),
});

export const snapshotSaveMetadata = createServiceActionMetadata({
  name: 'snapshot-save',
  title: 'Save Project Snapshot',
  description:
    'Save snapshot of current differences (overwrites existing snapshot)',
  inputSchema: snapshotSaveInputSchema,
  outputSchema: snapshotSaveOutputSchema,
  scope: 'dev',
});
