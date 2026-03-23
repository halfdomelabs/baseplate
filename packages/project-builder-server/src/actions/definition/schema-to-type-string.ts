import type { z } from 'zod';

import { createAuxiliaryTypeStore, printNode, zodToTs } from 'zod-to-ts';

import { buildTsDescriptionRegistry } from './build-ts-description-registry.js';

/**
 * Converts a Zod schema to a TypeScript type string using `zodToTs`.
 *
 * Automatically annotates reference fields, entity types, and validation
 * constraints as JSDoc comments in the output.
 *
 * Shared by `get-entity-schema` and `get-plugin-info` actions.
 */
export function schemaToTypeString(schema: z.ZodType): string {
  const metadataRegistry = buildTsDescriptionRegistry(schema);

  const { node } = zodToTs(schema, {
    auxiliaryTypeStore: createAuxiliaryTypeStore(),
    unrepresentable: 'any',
    metadataRegistry,
  });

  return printNode(node);
}
