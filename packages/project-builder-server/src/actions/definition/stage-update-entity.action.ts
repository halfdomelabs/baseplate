import { updateEntity } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { getOrCreateDraftSession, saveDraftSession } from './draft-session.js';
import {
  definitionIssueSchema,
  validateDraftDefinition,
} from './validate-draft.js';

const stageUpdateEntityInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  entityTypeName: z
    .string()
    .describe('The entity type being updated (e.g., "feature", "model").'),
  entityId: z
    .string()
    .describe('The ID of the entity to update (e.g., "model:abc123").'),
  entityData: z
    .record(z.string(), z.unknown())
    .describe('The full updated entity data.'),
});

const stageUpdateEntityOutputSchema = z.object({
  message: z.string().describe('A summary of the staged change.'),
  issues: z
    .array(definitionIssueSchema)
    .optional()
    .describe('Definition issues found after staging.'),
});

export const stageUpdateEntityAction = createServiceAction({
  name: 'stage-update-entity',
  title: 'Stage Update Entity',
  description:
    'Stage an entity update in the draft session. Changes are not persisted until commit-draft is called.',
  inputSchema: stageUpdateEntityInputSchema,
  outputSchema: stageUpdateEntityOutputSchema,
  handler: async (input, context) => {
    const { session, entityContext, parserContext, projectDirectory } =
      await getOrCreateDraftSession(input.project, context);

    const newDefinition = updateEntity(
      {
        entityTypeName: input.entityTypeName,
        entityId: input.entityId,
        entityData: input.entityData,
      },
      entityContext,
    );

    session.draftDefinition = newDefinition;

    const { errors, warnings } = validateDraftDefinition(
      newDefinition,
      parserContext,
    );

    if (errors.length > 0) {
      const messages = errors.map((e) => e.message).join('; ');
      throw new Error(`Staging blocked by definition errors: ${messages}`);
    }

    await saveDraftSession(projectDirectory, session);

    return {
      message: `Staged update of ${input.entityTypeName} entity "${input.entityId}". Use commit-draft to persist.`,
      issues: warnings.length > 0 ? warnings : undefined,
    };
  },
  writeCliOutput: (output) => {
    console.info(`✓ ${output.message}`);
    if (output.issues) {
      for (const issue of output.issues) {
        console.warn(`  ⚠ ${issue.message}`);
      }
    }
  },
});
