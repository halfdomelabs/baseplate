import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { getProjectByNameOrId } from '../utils/projects.js';
import { deleteDraftSession, loadDraftSession } from './draft-session.js';

const discardDraftInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
});

const discardDraftOutputSchema = z.object({
  message: z.string().describe('A summary of the discard result.'),
});

export const discardDraftAction = createServiceAction({
  name: 'discard-draft',
  title: 'Discard Draft',
  description:
    'Discard the current draft session, removing all staged changes.',
  inputSchema: discardDraftInputSchema,
  outputSchema: discardDraftOutputSchema,
  handler: async (input, context) => {
    const project = getProjectByNameOrId(context.projects, input.project);

    const session = await loadDraftSession(project.directory);
    if (!session) {
      return { message: 'No draft session to discard.' };
    }

    await deleteDraftSession(project.directory);

    return { message: 'Draft session discarded.' };
  },
  writeCliOutput: (output) => {
    console.info(`✓ ${output.message}`);
  },
});
