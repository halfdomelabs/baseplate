import { createEntity } from '@baseplate-dev/project-builder-lib';
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

const stageCreateEntityInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  entityTypeName: z
    .string()
    .describe('The entity type to create (e.g., "feature", "model").'),
  entityData: z
    .record(z.string(), z.unknown())
    .describe('The entity data to create.'),
  parentEntityId: z
    .string()
    .optional()
    .describe(
      'Required for nested entity types. The ID of the parent entity to add to.',
    ),
});

const stageCreateEntityOutputSchema = z.object({
  message: z.string().describe('A summary of the staged change.'),
  issues: z
    .array(definitionIssueSchema)
    .optional()
    .describe('Definition issues found after staging.'),
});

export const stageCreateEntityAction = createServiceAction({
  name: 'stage-create-entity',
  title: 'Stage Create Entity',
  description:
    'Stage a new entity creation in the draft session. Changes are not persisted until commit-draft is called.',
  inputSchema: stageCreateEntityInputSchema,
  outputSchema: stageCreateEntityOutputSchema,
  handler: async (input, context) => {
    assertEntityTypeNotBlacklisted(input.entityTypeName);

    const { session, entityContext, parserContext, projectDirectory } =
      await getOrCreateDraftSession(input.project, context);

    const newDefinition = createEntity(
      {
        entityTypeName: input.entityTypeName,
        entityData: input.entityData,
        parentEntityId: input.parentEntityId,
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
      message: `Staged creation of ${input.entityTypeName} entity. Use commit-draft to persist.`,
      issues: warnings.length > 0 ? warnings.map(mapIssueToOutput) : undefined,
    };
  },
  writeCliOutput: writeIssuesCliOutput,
});
