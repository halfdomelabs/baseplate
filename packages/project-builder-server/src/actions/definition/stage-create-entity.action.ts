import { createEntity } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { getOrCreateDraftSession, saveDraftSession } from './draft-session.js';
import {
  definitionIssueSchema,
  validateDraftDefinition,
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
      message: `Staged creation of ${input.entityTypeName} entity. Use commit-draft to persist.`,
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
