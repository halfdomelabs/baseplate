import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

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

export const searchEntitiesMetadata = createServiceActionMetadata({
  name: 'search-entities',
  title: 'Search Entities',
  description:
    'Search entities by name across the project definition. Returns matching entity stubs.',
  inputSchema: searchEntitiesInputSchema,
  outputSchema: searchEntitiesOutputSchema,
  scope: 'user',
});
