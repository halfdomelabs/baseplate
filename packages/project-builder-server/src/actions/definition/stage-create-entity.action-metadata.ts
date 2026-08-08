import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

import { definitionIssueSchema } from './definition-issue-schema.js';

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

export const stageCreateEntityMetadata = createServiceActionMetadata({
  name: 'stage-create-entity',
  title: 'Stage Create Entity',
  description:
    'Stage a new entity creation in the draft session. Changes are not persisted until commit-draft is called.',
  inputSchema: stageCreateEntityInputSchema,
  outputSchema: stageCreateEntityOutputSchema,
  scope: 'user',
});
