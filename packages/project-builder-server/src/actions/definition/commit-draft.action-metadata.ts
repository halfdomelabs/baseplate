import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

import { definitionIssueSchema } from './definition-issue-schema.js';

const commitDraftInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
});
const commitDraftOutputSchema = z.object({
  message: z.string().describe('A summary of the commit result.'),
  issues: z
    .array(definitionIssueSchema)
    .optional()
    .describe('Definition issues that blocked the commit.'),
});

export const commitDraftMetadata = createServiceActionMetadata({
  name: 'commit-draft',
  title: 'Commit Draft',
  description:
    'Commit the staged draft changes to the project-definition.json file.',
  inputSchema: commitDraftInputSchema,
  outputSchema: commitDraftOutputSchema,
  scope: 'user',
});
