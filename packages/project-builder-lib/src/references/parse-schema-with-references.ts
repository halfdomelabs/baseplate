import type { z } from 'zod';

import type { ResolveZodRefPayloadNamesOptions } from './resolve-zod-ref-payload-names.js';
import type { ResolvedZodRefPayload } from './types.js';

import { extractDefinitionRefs } from './extract-definition-refs.js';
import { resolveZodRefPayloadNames } from './resolve-zod-ref-payload-names.js';

/**
 * Parses a schema with references.
 *
 * Validates the input using Zod, then walks the schema structure alongside
 * the parsed data to extract entity/reference/expression metadata.
 *
 * @param schema - The already-constructed Zod schema
 * @param input - The input to parse
 * @param options - Options for resolving ref payload names
 * @returns The parsed data with resolved ref metadata
 */
export function parseSchemaWithTransformedReferences<T extends z.ZodType>(
  schema: T,
  input: unknown,
  options?: ResolveZodRefPayloadNamesOptions,
): ResolvedZodRefPayload<z.output<T>> {
  // Step 1: Validate with Zod
  const value = schema.parse(input);

  // Step 2: Walk schema+data in parallel to extract ref metadata
  const refPayload = extractDefinitionRefs(schema, value);

  return resolveZodRefPayloadNames(refPayload, options);
}
