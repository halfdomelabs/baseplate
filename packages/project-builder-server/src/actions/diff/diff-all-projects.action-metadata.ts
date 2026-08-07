import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

const diffAllProjectsInputSchema = z.object({
  include: z
    .array(z.string())
    .optional()
    .describe('Filter files by glob patterns.'),
});
const changedFileSchema = z.object({
  packageName: z
    .string()
    .describe('The name of the package the file belongs to.'),
  path: z.string().describe('The package-relative path of the file.'),
  type: z
    .enum(['added', 'modified', 'deleted'])
    .describe('The type of difference for this file.'),
});
const projectDiffResultSchema = z.object({
  projectName: z.string().describe('The name of the project.'),
  status: z
    .enum(['success', 'error'])
    .describe('The status of the diff operation for this project.'),
  message: z.string().describe('Human-readable result message.'),
  totalDiffs: z
    .number()
    .optional()
    .describe('Total number of files with differences.'),
  changedFiles: z
    .array(changedFileSchema)
    .describe('The files with differences, if any.'),
});
const diffAllProjectsOutputSchema = z.object({
  overallStatus: z
    .enum(['success', 'differences-found', 'error'])
    .describe('The overall status of the diff operation across all projects.'),
  message: z.string().describe('Human-readable result summary.'),
  hasDifferences: z
    .boolean()
    .describe('Whether any differences were found across all projects.'),
  results: z
    .array(projectDiffResultSchema)
    .describe('Results for each individual project.'),
});

export const diffAllProjectsMetadata = createServiceActionMetadata({
  name: 'diff-all-projects',
  title: 'Diff All Projects',
  description: 'Diff all projects against what the sync engine would generate',
  inputSchema: diffAllProjectsInputSchema,
  outputSchema: diffAllProjectsOutputSchema,
  scope: 'dev',
});
