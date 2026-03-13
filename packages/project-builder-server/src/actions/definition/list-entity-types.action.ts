import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { BLACKLISTED_ENTITY_TYPES } from './entity-type-blacklist.js';
import { loadEntityServiceContext } from './load-entity-service-context.js';

const listEntityTypesInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
});

const entityTypeInfoSchema = z.object({
  name: z.string().describe('The entity type name.'),
  parentEntityTypeName: z
    .string()
    .nullable()
    .describe('The parent entity type name, or null for top-level entities.'),
});

const listEntityTypesOutputSchema = z.object({
  entityTypes: z
    .array(entityTypeInfoSchema)
    .describe('The list of available entity types.'),
});

export const listEntityTypesAction = createServiceAction({
  name: 'list-entity-types',
  title: 'List Entity Types',
  description:
    'List all available entity types in the project definition schema. Returns type names and parent relationships.',
  inputSchema: listEntityTypesInputSchema,
  outputSchema: listEntityTypesOutputSchema,
  writeCliOutput: (output) => {
    for (const entityType of output.entityTypes) {
      const parent = entityType.parentEntityTypeName
        ? ` (parent: ${entityType.parentEntityTypeName})`
        : '';
      console.info(`  ${entityType.name}${parent}`);
    }
  },
  handler: async (input, context) => {
    const { entityContext } = await loadEntityServiceContext(
      input.project,
      context,
    );

    const entityTypes = [...entityContext.entityTypeMap.entries()]
      .filter(([name]) => !BLACKLISTED_ENTITY_TYPES.has(name))
      .map(([name, metadata]) => ({
        name,
        parentEntityTypeName: metadata.parentEntityTypeName ?? null,
      }));

    return { entityTypes };
  },
});
