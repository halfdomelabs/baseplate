import { deleteEntity } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { getOrCreateDraftSession } from './draft-session.js';
import { assertEntityTypeNotBlacklisted } from './entity-type-blacklist.js';
import {
  definitionIssueSchema,
  mapIssueToOutput,
  validateAndSaveDraft,
  writeIssuesCliOutput,
} from './validate-draft.js';

const stageDeleteEntityInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  entityTypeName: z
    .string()
    .describe('The entity type being deleted (e.g., "feature", "model").'),
  entityId: z
    .string()
    .describe('The ID of the entity to delete (e.g., "model:abc123").'),
});

const stageDeleteEntityOutputSchema = z.object({
  message: z.string().describe('A summary of the staged change.'),
  issues: z
    .array(definitionIssueSchema)
    .optional()
    .describe('Definition issues found after staging.'),
});

export const stageDeleteEntityAction = createServiceAction({
  name: 'stage-delete-entity',
  title: 'Stage Delete Entity',
  description:
    'Stage an entity deletion in the draft session. Changes are not persisted until commit-draft is called.',
  inputSchema: stageDeleteEntityInputSchema,
  outputSchema: stageDeleteEntityOutputSchema,
  handler: async (input, context) => {
    assertEntityTypeNotBlacklisted(input.entityTypeName);

    const { session, entityContext, parserContext, projectDirectory } =
      await getOrCreateDraftSession(input.project, context);

    const newDefinition = deleteEntity(
      {
        entityTypeName: input.entityTypeName,
        entityId: input.entityId,
      },
      entityContext,
    );

    const { warnings } = await validateAndSaveDraft(
      newDefinition,
      parserContext,
      session,
      projectDirectory,
    );

    return {
      message: `Staged deletion of ${input.entityTypeName} entity "${input.entityId}". Use commit-draft to persist.`,
      issues: warnings.length > 0 ? warnings.map(mapIssueToOutput) : undefined,
    };
  },
  writeCliOutput: writeIssuesCliOutput,
});
