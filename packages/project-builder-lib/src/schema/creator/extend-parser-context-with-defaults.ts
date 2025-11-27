import { z } from 'zod';

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
      // Auto-add .optional() to the schema
      const optionalSchema = schema.optional();

      switch (mode) {
        case 'populate': {
          // Use preprocess to inject defaults before validation
          return z
            .preprocess((value: z.input<z.ZodOptional<T>>) => {
              if (value === undefined) {
                return defaultValue;
              }
              return value;
            }, optionalSchema)
            .optional();
        }
        case 'strip': {
          // Use transform to remove values matching defaults after validation
          return optionalSchema
            .transform((value) => {
              if (isEmpty(value)) {
                return undefined;
              }

              return value;
            })
            .optional();
        }
        case 'preserve': {
          // Return schema with .optional() added

          return optionalSchema.transform((x) => x).optional();
        }
      }
    },
  };
}
