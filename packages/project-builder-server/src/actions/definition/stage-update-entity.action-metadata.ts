import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

import { definitionIssueSchema } from './definition-issue-schema.js';

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

export const stageUpdateEntityMetadata = createServiceActionMetadata({
  name: 'stage-update-entity',
  title: 'Stage Update Entity',
  description:
    'Stage an entity update in the draft session. Changes are not persisted until commit-draft is called.',
  inputSchema: stageUpdateEntityInputSchema,
  outputSchema: stageUpdateEntityOutputSchema,
  scope: 'user',
});
