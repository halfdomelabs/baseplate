import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { loadEntityServiceContext } from './load-entity-service-context.js';

const searchEntitiesInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  query: z
    .string()
    .describe('Case-insensitive substring to match against entity names.'),
  entityTypeName: z
    .string()
    .optional()
    .describe('Restrict search to a specific entity type.'),
});

const entityStubSchema = z.object({
  id: z.string().describe('The entity ID.'),
  name: z.string().describe('The entity name.'),
  type: z.string().describe('The entity type name.'),
});

const searchEntitiesOutputSchema = z.object({
  results: z.array(entityStubSchema).describe('Matching entities.'),
});

export const searchEntitiesAction = createServiceAction({
  name: 'search-entities',
  title: 'Search Entities',
  description:
    'Search entities by name across the project definition. Returns matching entity stubs.',
  inputSchema: searchEntitiesInputSchema,
  outputSchema: searchEntitiesOutputSchema,
  writeCliOutput: (output) => {
    if (output.results.length === 0) {
      console.info('  No matching entities found.');
      return;
    }
    for (const entity of output.results) {
      console.info(`  ${entity.name} (${entity.type}) [${entity.id}]`);
    }
  },
  handler: async (input, context) => {
    const { container } = await loadEntityServiceContext(
      input.project,
      context,
    );

    const queryLower = input.query.toLowerCase();

    const results = container.entities
      .filter((entity) => {
        if (input.entityTypeName && entity.type.name !== input.entityTypeName) {
          return false;
        }
        return entity.name.toLowerCase().includes(queryLower);
      })
      .map((entity) => ({
        id: entity.id,
        name: entity.name,
        type: entity.type.name,
      }));

    return { results };
  },
});
