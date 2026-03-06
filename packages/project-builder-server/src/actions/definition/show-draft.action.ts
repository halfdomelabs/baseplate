import { diffSerializedDefinitions } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { getProjectByNameOrId } from '../utils/projects.js';
import { loadDraftSession } from './draft-session.js';
import { loadEntityServiceContext } from './load-entity-service-context.js';

const showDraftInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
});

const draftChangeSchema = z.object({
  label: z
    .string()
    .describe('Human-readable label (e.g., "Feature: payments").'),
  type: z.enum(['added', 'updated', 'removed']).describe('The type of change.'),
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
  changes: z
    .array(draftChangeSchema)
    .nullable()
    .describe('Entity-level changes in the draft, or null if no draft.'),
});

export const showDraftAction = createServiceAction({
  name: 'show-draft',
  title: 'Show Draft',
  description:
    'Show the current draft session status and staged changes for a project.',
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
        changes: null,
      };
    }

    // Load the current definition to diff against
    const { container } = await loadEntityServiceContext(
      input.project,
      context,
    );
    const currentEntityContext = container.toEntityServiceContext();

    const diff = diffSerializedDefinitions(
      container.schema,
      currentEntityContext.serializedDefinition,
      session.draftDefinition,
    );

    return {
      hasDraft: true,
      sessionId: session.sessionId,
      definitionHash: session.definitionHash,
      changes: diff.entries.map((entry) => ({
        label: entry.label,
        type: entry.type,
      })),
    };
  },
  writeCliOutput: (output) => {
    if (!output.hasDraft) {
      console.info('No draft session.');
      return;
    }
    console.info(`Draft session: ${output.sessionId}`);
    console.info(`Definition hash: ${output.definitionHash}`);

    if (!output.changes || output.changes.length === 0) {
      console.info('No changes.');
      return;
    }

    console.info('Changes:');
    for (const change of output.changes) {
      const prefix =
        change.type === 'added' ? '+' : change.type === 'removed' ? '-' : '~';
      console.info(`  ${prefix} ${change.label} (${change.type})`);
    }
  },
});
