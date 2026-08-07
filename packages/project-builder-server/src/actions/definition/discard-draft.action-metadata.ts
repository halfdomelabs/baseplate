import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

const discardDraftInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
});
const discardDraftOutputSchema = z.object({
  message: z.string().describe('A summary of the discard result.'),
});

export const discardDraftMetadata = createServiceActionMetadata({
  name: 'discard-draft',
  title: 'Discard Draft',
  description:
    'Discard the current draft session, removing all staged changes.',
  inputSchema: discardDraftInputSchema,
  outputSchema: discardDraftOutputSchema,
  scope: 'user',
});
