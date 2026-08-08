import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

const getEntityInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  entityId: z
    .string()
    .describe('The ID of the entity to retrieve (e.g., "model:abc123").'),
});
const getEntityOutputSchema = z.object({
  entity: z
    .record(z.string(), z.unknown())
    .nullable()
    .describe(
      'The serialized entity data with references resolved to names, or null if not found.',
    ),
});

export const getEntityMetadata = createServiceActionMetadata({
  name: 'get-entity',
  title: 'Get Entity',
  description:
    'Get the full serialized data for a specific entity by ID. Returns name-resolved JSON.',
  inputSchema: getEntityInputSchema,
  outputSchema: getEntityOutputSchema,
  scope: 'user',
});
