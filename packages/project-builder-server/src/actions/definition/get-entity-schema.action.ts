import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { loadEntityServiceContext } from './load-entity-service-context.js';

const getEntitySchemaInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  entityTypeName: z
    .string()
    .describe(
      'The entity type to get the schema for (e.g., "feature", "model", "model-scalar-field").',
    ),
});

const getEntitySchemaOutputSchema = z.object({
  entityTypeName: z.string().describe('The entity type name.'),
  parentEntityTypeName: z
    .string()
    .nullable()
    .describe('The parent entity type name, or null for top-level entities.'),
  schema: z
    .record(z.string(), z.unknown())
    .describe('The JSON Schema for this entity type.'),
});

export const getEntitySchemaAction = createServiceAction({
  name: 'get-entity-schema',
  title: 'Get Entity Schema',
  description:
    'Get the JSON Schema for a given entity type. Useful for understanding valid field shapes before creating or updating entities.',
  inputSchema: getEntitySchemaInputSchema,
  outputSchema: getEntitySchemaOutputSchema,
  handler: async (input, context) => {
    const { entityContext } = await loadEntityServiceContext(
      input.project,
      context,
    );

    const metadata = entityContext.entityTypeMap.get(input.entityTypeName);
    if (!metadata) {
      throw new Error(
        `Unknown entity type: "${input.entityTypeName}". Use list-entities with entityTypeName "*" to discover available types.`,
      );
    }

    const jsonSchema = z.toJSONSchema(metadata.elementSchema, {
      unrepresentable: 'any',
    });

    return {
      entityTypeName: input.entityTypeName,
      parentEntityTypeName: metadata.parentEntityTypeName ?? null,
      schema: jsonSchema as Record<string, unknown>,
    };
  },
});
