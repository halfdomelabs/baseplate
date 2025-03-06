import type { z } from 'zod';

import type { ResolvedZodRefPayload } from './types.js';

import { ZodRefWrapper } from './ref-builder.js';
import {
  resolveZodRefPayloadNames,
  type ResolveZodRefPayloadNamesOptions,
} from './resolve-zod-ref-payload-names.js';

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
