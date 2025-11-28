import type { z } from 'zod';

import type { DefinitionSchemaCreatorOptions } from './types.js';

function isEmpty(value: unknown): boolean {
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
          // Use transform to remove values matching defaults after validation
          return schema
            .transform((value) => {
              if (value === defaultValue) return undefined;
              if (isEmpty(value)) {
                return undefined;
              }

              return value;
            })
            .optional();
        }
        case 'preserve': {
          // Return schema with .optional() added

          return schema.transform((x) => x).optional();
        }
      }
    },
  };
}
