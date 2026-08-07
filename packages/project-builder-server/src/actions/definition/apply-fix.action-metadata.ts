import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

import { definitionIssueSchema } from './definition-issue-schema.js';

const applyFixInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  fixId: z
    .string()
    .describe(
      'The deterministic fix ID returned by stage actions (e.g., "fix-a1b2c3d4").',
    ),
});
const applyFixOutputSchema = z.object({
  message: z.string().describe('A summary of the applied fix.'),
  issues: z
    .array(definitionIssueSchema)
    .optional()
    .describe('Remaining definition issues after applying the fix.'),
});

export const applyFixMetadata = createServiceActionMetadata({
  name: 'apply-fix',
  title: 'Apply Fix',
  description:
    'Apply an auto-fix for a definition issue in the current draft session.',
  inputSchema: applyFixInputSchema,
  outputSchema: applyFixOutputSchema,
  scope: 'user',
});
