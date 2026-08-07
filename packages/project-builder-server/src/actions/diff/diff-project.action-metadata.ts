import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

const diffProjectInputSchema = z.object({
  project: z.string().describe('The name or ID of the project to diff.'),
  compact: z
    .boolean()
    .optional()
    .describe('Whether to show compact diff format.'),
  packages: z
    .array(z.string())
    .optional()
    .describe('Only show diffs for specific packages.'),
  include: z
    .array(z.string())
    .optional()
    .describe('Filter files by glob patterns.'),
});
const packageDiffResultSchema = z.object({
  name: z.string().describe('The name of the package.'),
  packageDirectory: z.string().describe('The directory of the package.'),
  diffSummary: z.object({
    totalFiles: z.number().describe('The diff summary for this package.'),
    files: z.array(
      z.object({
        path: z.string(),
        status: z.enum(['modified', 'added', 'deleted']),
        diff: z.string().optional(),
      }),
    ),
  }),
  hasDifferences: z.boolean().describe('Whether differences were found.'),
});
const diffProjectOutputSchema = z.object({
  packageResults: z.array(packageDiffResultSchema),
  totalDiffs: z.number().describe('Total number of files with differences.'),
  hasDifferences: z
    .boolean()
    .describe('Whether any differences were found across all applications.'),
});

export const diffProjectMetadata = createServiceActionMetadata({
  name: 'diff-project',
  title: 'Diff Project',
  description:
    'Generate a diff between what would be generated and what currently exists in the working directory',
  inputSchema: diffProjectInputSchema,
  outputSchema: diffProjectOutputSchema,
  scope: 'user',
});
