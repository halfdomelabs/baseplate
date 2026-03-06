import { z } from 'zod';
import { createAuxiliaryTypeStore, printNode, zodToTs } from 'zod-to-ts';

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
    .string()
    .describe('The TypeScript type representation of this entity type.'),
});

export const getEntitySchemaAction = createServiceAction({
  name: 'get-entity-schema',
  title: 'Get Entity Schema',
  description:
    'Get the TypeScript type for a given entity type. Useful for understanding valid field shapes before creating or updating entities.',
  inputSchema: getEntitySchemaInputSchema,
  outputSchema: getEntitySchemaOutputSchema,
  writeCliOutput: (output) => {
    console.info(output.schema);
  },
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

    const { node } = zodToTs(metadata.elementSchema, {
      auxiliaryTypeStore: createAuxiliaryTypeStore(),
      unrepresentable: 'any',
    });
    const schemaText = printNode(node);

    return {
      entityTypeName: input.entityTypeName,
      parentEntityTypeName: metadata.parentEntityTypeName ?? null,
      schema: schemaText,
    };
  },
});
