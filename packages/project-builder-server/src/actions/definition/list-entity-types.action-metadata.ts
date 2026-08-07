import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

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

export const listEntityTypesMetadata = createServiceActionMetadata({
  name: 'list-entity-types',
  title: 'List Entity Types',
  description:
    'List all available entity types in the project definition schema. Returns type names and parent relationships.',
  inputSchema: listEntityTypesInputSchema,
  outputSchema: listEntityTypesOutputSchema,
  scope: 'user',
});
