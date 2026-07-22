import { patchEntity } from '@baseplate-dev/project-builder-lib';
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

const stagePatchEntityInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  entityTypeName: z
    .string()
    .describe('The entity type being patched (e.g., "feature", "model").'),
  entityId: z
    .string()
    .describe('The ID of the entity to patch (e.g., "model:abc123").'),
  entityData: z
    .record(z.string(), z.unknown())
    .describe(
      'Partial entity data. Only the provided root-level fields are updated (shallow merge); nested objects and arrays are replaced wholesale, not merged. Omitted fields are preserved.',
    ),
});

const stagePatchEntityOutputSchema = z.object({
  message: z.string().describe('A summary of the staged change.'),
  issues: z
    .array(definitionIssueSchema)
    .optional()
    .describe('Definition issues found after staging.'),
});

export const stagePatchEntityAction = createServiceAction({
  name: 'stage-patch-entity',
  title: 'Stage Patch Entity',
  description:
    'Stage a partial entity update in the draft session, updating only the provided root-level fields. Changes are not persisted until commit-draft is called.',
  inputSchema: stagePatchEntityInputSchema,
  outputSchema: stagePatchEntityOutputSchema,
  handler: async (input, context) => {
    assertEntityTypeNotBlacklisted(input.entityTypeName);

    const {
      session,
      entityContext,
      oldRefPayload,
      parserContext,
      projectDirectory,
    } = await getOrCreateDraftSession(input.project, context);

    const newDefinition = patchEntity(
      {
        entityTypeName: input.entityTypeName,
        entityId: input.entityId,
        entityData: input.entityData,
      },
      entityContext,
    );

    const { warnings } = await validateAndSaveDraft(
      newDefinition,
      parserContext,
      session,
      projectDirectory,
      undefined,
      oldRefPayload,
    );

    return {
      message: `Staged patch of ${input.entityTypeName} entity "${input.entityId}". Use commit-draft to persist.`,
      issues: warnings.length > 0 ? warnings.map(mapIssueToOutput) : undefined,
    };
  },
  writeCliOutput: writeIssuesCliOutput,
});
