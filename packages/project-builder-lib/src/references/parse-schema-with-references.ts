import type {
  def,
  DefinitionSchemaCreator,
  DefinitionSchemaCreatorOptions,
} from '#src/schema/index.js';

import { cleanDefaultValues } from '#src/parser/clean-default-values.js';
import { createDefinitionSchemaParserContext } from '#src/schema/creator/index.js';

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
 * When `defaultMode` is 'strip', runs a post-parse walk to remove values that
 * match their registered defaults before extracting ref metadata.
 *
 * @param schemaCreator - The schema creator function
 * @param input - The input to parse
 * @param schemaCreatorOptions - Options for the schema creator
 * @param options - Options for resolving ref payload names
 * @returns The parsed data with resolved ref metadata
 */
export function parseSchemaWithTransformedReferences<
  T extends DefinitionSchemaCreator,
>(
  schemaCreator: T,
  input: unknown,
  schemaCreatorOptions: Omit<
    DefinitionSchemaCreatorOptions,
    'transformReferences'
  >,
  options?: ResolveZodRefPayloadNamesOptions,
): ResolvedZodRefPayload<def.InferOutput<T>> {
  const schemaContext =
    createDefinitionSchemaParserContext(schemaCreatorOptions);
  const schema = schemaCreator(schemaContext) as def.InferSchema<T>;

  // Step 1: Validate with Zod (parse normally, no special mode needed)
  const rawValue = schema.parse(input);

  // Step 2: If strip mode, remove values matching their defaults via post-parse walk
  const value =
    schemaCreatorOptions.defaultMode === 'strip'
      ? cleanDefaultValues(schema, rawValue)
      : rawValue;

  // Step 3: Walk schema+data in parallel to extract ref metadata
  const refPayload = extractDefinitionRefs(schema, value);

  return resolveZodRefPayloadNames(refPayload, options);
}
