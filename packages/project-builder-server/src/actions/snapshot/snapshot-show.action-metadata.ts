import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

const snapshotShowInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  app: z.string().describe('The app name within the project.'),
  baseplateDirectory: z
    .string()
    .optional()
    .describe(
      'Custom baseplate directory for snapshot resolution. Defaults to <projectDirectory>/baseplate.',
    ),
});
const snapshotFileEntry = z.object({
  path: z.string().describe('File path.'),
  diffFile: z.string().optional().describe('Associated diff file if modified.'),
});
const snapshotShowOutputSchema = z.object({
  success: z
    .boolean()
    .describe('Whether the snapshot show operation was successful.'),
  message: z.string().describe('Result message.'),
  snapshotPath: z
    .string()
    .optional()
    .describe('Path to the snapshot directory.'),
  files: z
    .object({
      modified: z
        .array(snapshotFileEntry)
        .describe('Modified files in snapshot.'),
      added: z
        .array(
          z.object({
            path: z.string().describe('File path.'),
            contentFile: z
              .string()
              .optional()
              .describe('Associated content file.'),
          }),
        )
        .describe('Added files in snapshot.'),
      deleted: z.array(z.string()).describe('Deleted files in snapshot.'),
    })
    .describe('Files tracked in the snapshot.'),
  totalFiles: z.number().describe('Total number of files in snapshot.'),
});

export const snapshotShowMetadata = createServiceActionMetadata({
  name: 'snapshot-show',
  title: 'Show Snapshot Contents',
  description: 'Display current snapshot contents and tracked files',
  inputSchema: snapshotShowInputSchema,
  outputSchema: snapshotShowOutputSchema,
  scope: 'dev',
});
