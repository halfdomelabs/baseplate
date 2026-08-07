import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

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

export const getEntitySchemaMetadata = createServiceActionMetadata({
  name: 'get-entity-schema',
  title: 'Get Entity Schema',
  description:
    'Get the TypeScript type for a given entity type. Useful for understanding valid field shapes before creating or updating entities.',
  inputSchema: getEntitySchemaInputSchema,
  outputSchema: getEntitySchemaOutputSchema,
  scope: 'user',
});
