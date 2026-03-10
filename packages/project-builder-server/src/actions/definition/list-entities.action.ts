import { listEntities } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { loadEntityServiceContext } from './load-entity-service-context.js';

const listEntitiesInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  entityTypeName: z
    .string()
    .describe(
      'The entity type to list (e.g., "feature", "model", "model-scalar-field").',
    ),
  parentEntityId: z
    .string()
    .optional()
    .describe(
      'Required for nested entity types. The ID of the parent entity to scope the listing.',
    ),
});

const entityStubSchema = z.object({
  id: z.string().describe('The entity ID.'),
  name: z.string().describe('The entity name.'),
  type: z.string().describe('The entity type name.'),
});

const listEntitiesOutputSchema = z.object({
  entities: z.array(entityStubSchema).describe('The list of entities.'),
});

export const listEntitiesAction = createServiceAction({
  name: 'list-entities',
  title: 'List Entities',
  description:
    'List entities of a given type in the project definition. Use list-entity-types to discover available entity type names.',
  inputSchema: listEntitiesInputSchema,
  outputSchema: listEntitiesOutputSchema,
  writeCliOutput: (output) => {
    for (const entity of output.entities) {
      console.info(`  ${entity.name} (${entity.id})`);
    }
  },
  handler: async (input, context) => {
    const { entityContext } = await loadEntityServiceContext(
      input.project,
      context,
    );

    const entities = listEntities(
      {
        entityTypeName: input.entityTypeName,
        parentEntityId: input.parentEntityId,
      },
      entityContext,
    );

    return { entities };
  },
});
