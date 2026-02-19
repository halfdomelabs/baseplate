import type { z } from 'zod';

import { definitionDefaultRegistry } from './definition-default-registry.js';

export type WithDefaultType = <T extends z.ZodType>(
  schema: T,
  defaultValue: z.input<T>,
) => z.ZodOptional<
  z.ZodType<z.output<z.ZodOptional<T>>, z.input<z.ZodOptional<T>>>
>;

/**
 * Extends the parser context with default value handling functionality.
 *
 * Uses `prefault` to ensure defaults are populated during Zod parse, and
 * registers the default value in the registry so `cleanDefaultValues()` can
 * strip matching values during serialization.
 *
 * @returns An object containing the withDefault method
 */
export function extendParserContextWithDefaults(): {
  withDefault: WithDefaultType;
} {
  return {
    withDefault: function withDefault<T extends z.ZodType>(
      schema: T,
      defaultValue: z.input<T>,
    ): z.ZodOptional<
      z.ZodType<z.output<z.ZodOptional<T>>, z.input<z.ZodOptional<T>>>
    > {
      const result = schema.prefault(defaultValue).optional();
      definitionDefaultRegistry.set(result, { defaultValue });
      return result;
    },
  };
}
