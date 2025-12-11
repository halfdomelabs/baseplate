import type { z } from 'zod';

import type { DefinitionSchemaParserContext } from './types.js';

/**
 * Type constraint for any schema creator function (with or without slots).
 * Works with both:
 * - `definitionSchema` which returns `(ctx) => ZodType`
 * - `definitionSchemaWithSlots` which returns `(ctx, slots) => ZodType`
 */
type AnyDefinitionSchemaCreator = (
  ctx: DefinitionSchemaParserContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => z.ZodType;

/**
 * Infers the Zod schema type from a schema creator function.
 */
export type InferSchema<T extends AnyDefinitionSchemaCreator> = ReturnType<T>;

/**
 * Infers the input type (what you pass to parse) from a schema creator function.
 */
export type InferInput<T extends AnyDefinitionSchemaCreator> = z.input<
  ReturnType<T>
>;

/**
 * Infers the output type (what parse returns) from a schema creator function.
 */
export type InferOutput<T extends AnyDefinitionSchemaCreator> = z.output<
  ReturnType<T>
>;
