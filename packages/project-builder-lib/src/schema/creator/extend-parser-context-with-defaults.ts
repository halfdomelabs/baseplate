import type { z } from 'zod';

import type { DefinitionSchemaCreatorOptions } from './types.js';

import { definitionDefaultRegistry } from './definition-default-registry.js';

export function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.values(value).every((val) => val === undefined);
  }
  if (typeof value === 'string') {
    return value === '';
  }
  return false;
}

export type WithDefaultType = <T extends z.ZodType>(
  schema: T,
  defaultValue: z.input<T>,
) => z.ZodOptional<
  z.ZodType<z.output<z.ZodOptional<T>>, z.input<z.ZodOptional<T>>>
>;

/**
 * Extends the parser context with default value handling functionality.
 *
 * @param options - The schema creator options containing the defaultMode
 * @returns An object containing the withDefault method
 */
export function extendParserContextWithDefaults(
  options: DefinitionSchemaCreatorOptions,
): {
  withDefault: WithDefaultType;
} {
  const mode = options.defaultMode ?? 'populate';

  return {
    withDefault: function withDefault<T extends z.ZodType>(
      schema: T,
      defaultValue: z.input<T>,
    ): z.ZodOptional<
      z.ZodType<z.output<z.ZodOptional<T>>, z.input<z.ZodOptional<T>>>
    > {
      switch (mode) {
        case 'populate': {
          return schema.prefault(defaultValue).optional();
        }
        case 'strip': {
          // Build the schema the same as populate mode. The stripping of
          // default-matching values happens in a post-parse walk via
          // `stripDefaultsFromData()`, which reads the registry annotation.
          const result = schema.prefault(defaultValue).optional();
          definitionDefaultRegistry.set(result, { defaultValue });
          return result;
        }
      }
    },
  };
}
