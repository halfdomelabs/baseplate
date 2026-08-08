import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

import { definitionIssueSchema } from './definition-issue-schema.js';

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

export const stagePatchEntityMetadata = createServiceActionMetadata({
  name: 'stage-patch-entity',
  title: 'Stage Patch Entity',
  description:
    'Stage a partial entity update in the draft session, updating only the provided root-level fields. Changes are not persisted until commit-draft is called.',
  inputSchema: stagePatchEntityInputSchema,
  outputSchema: stagePatchEntityOutputSchema,
  scope: 'user',
});
