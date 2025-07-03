import type { z } from 'zod';

import type {
  def,
  DefinitionSchemaCreator,
  DefinitionSchemaCreatorOptions,
} from '#src/schema/index.js';

import { zPluginWrapper } from '#src/plugins/index.js';
import { createDefinitionSchemaParserContext } from '#src/schema/creator/index.js';

import type { ResolveZodRefPayloadNamesOptions } from './resolve-zod-ref-payload-names.js';
import type { ResolvedZodRefPayload } from './types.js';

import { extractDefinitionRefs } from './extract-definition-refs.js';
import { ZodRefWrapper } from './ref-builder.js';
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
export function parseSchemaWithReferences<T extends z.ZodTypeAny>(
  schema: T,
  input: unknown,
  options?: ResolveZodRefPayloadNamesOptions,
): ResolvedZodRefPayload<z.output<T>> {
  const wrapper = ZodRefWrapper.create(schema);
  return resolveZodRefPayloadNames(wrapper.parse(input), options);
}

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
  const schema = schemaCreator(schemaContext);
  const schemaWithPlugins = zPluginWrapper(
    schema,
    schemaCreatorOptions.plugins,
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- using the type T which can be any zod schema
  const value = schemaWithPlugins.parse(input);
  const refPayload = extractDefinitionRefs(value);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- using the type T which can be any zod schema
  return resolveZodRefPayloadNames(refPayload, options);
}
