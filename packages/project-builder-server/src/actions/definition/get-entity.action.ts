import { getEntity } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { loadEntityServiceContext } from './load-entity-service-context.js';

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

export const getEntityAction = createServiceAction({
  name: 'get-entity',
  title: 'Get Entity',
  description:
    'Get the full serialized data for a specific entity by ID. Returns name-resolved JSON.',
  inputSchema: getEntityInputSchema,
  outputSchema: getEntityOutputSchema,
  handler: async (input, context) => {
    const { entityContext } = await loadEntityServiceContext(
      input.project,
      context,
    );

    const entity = getEntity(input.entityId, entityContext);

    return { entity: entity ?? null };
  },
});
