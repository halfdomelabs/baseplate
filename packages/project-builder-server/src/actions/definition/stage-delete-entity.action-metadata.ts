import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

import { definitionIssueSchema } from './definition-issue-schema.js';

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

export const stageDeleteEntityMetadata = createServiceActionMetadata({
  name: 'stage-delete-entity',
  title: 'Stage Delete Entity',
  description:
    'Stage an entity deletion in the draft session. Changes are not persisted until commit-draft is called.',
  inputSchema: stageDeleteEntityInputSchema,
  outputSchema: stageDeleteEntityOutputSchema,
  scope: 'user',
});
