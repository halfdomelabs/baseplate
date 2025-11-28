import type {
  def,
  DefinitionSchemaCreator,
  DefinitionSchemaCreatorOptions,
} from '#src/schema/index.js';

import { createDefinitionSchemaParserContext } from '#src/schema/creator/index.js';

import type { ResolveZodRefPayloadNamesOptions } from './resolve-zod-ref-payload-names.js';
import type { ResolvedZodRefPayload } from './types.js';

import { extractDefinitionRefs } from './extract-definition-refs.js';
import { resolveZodRefPayloadNames } from './resolve-zod-ref-payload-names.js';

/**
 * Parses a schema with references.
 *
 * @param schema - The schema to parse.
 * @param input - The input to parse.
 * @param options - The options for parsing the schema.
 *
 * @returns The parsed data.
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
  const schemaContext = createDefinitionSchemaParserContext({
    ...schemaCreatorOptions,
    transformReferences: true,
  });
  const schema = schemaCreator(schemaContext) as def.InferSchema<T>;

  const value = schema.parse(input);
  const refPayload = extractDefinitionRefs(value);

  return resolveZodRefPayloadNames(refPayload, options);
}
