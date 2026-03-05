import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { getProjectByNameOrId } from '../utils/projects.js';
import { loadDraftSession } from './draft-session.js';

const showDraftInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
});

const showDraftOutputSchema = z.object({
  hasDraft: z.boolean().describe('Whether a draft session exists.'),
  sessionId: z
    .string()
    .nullable()
    .describe('The session ID of the draft, or null if no draft.'),
  definitionHash: z
    .string()
    .nullable()
    .describe(
      'The hash of the project definition when the draft was created, or null if no draft.',
    ),
});

export const showDraftAction = createServiceAction({
  name: 'show-draft',
  title: 'Show Draft',
  description: 'Show the current draft session status for a project.',
  inputSchema: showDraftInputSchema,
  outputSchema: showDraftOutputSchema,
  handler: async (input, context) => {
    const project = getProjectByNameOrId(context.projects, input.project);

    const session = await loadDraftSession(project.directory);
    if (!session) {
      return {
        hasDraft: false,
        sessionId: null,
        definitionHash: null,
      };
    }

    return {
      hasDraft: true,
      sessionId: session.sessionId,
      definitionHash: session.definitionHash,
    };
  },
  writeCliOutput: (output) => {
    if (!output.hasDraft) {
      console.info('No draft session.');
      return;
    }
    console.info(`Draft session: ${output.sessionId}`);
    console.info(`Definition hash: ${output.definitionHash}`);
  },
});
