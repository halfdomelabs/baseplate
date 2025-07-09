import { z } from 'zod';

import type { DefinitionSchemaCreatorOptions } from './types.js';

function isEmpty(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).every((val) => val === undefined);
  }
  return value === false || value === '';
}

export type WithDefaultType = <T extends z.ZodTypeAny>(
  schema: T,
  defaultValue: z.infer<T>,
) => z.ZodEffects<
  z.ZodOptional<T>,
  z.output<z.ZodOptional<T>>,
  z.input<z.ZodOptional<T>>
>;

export interface WithDefaultContext {
  withDefault: WithDefaultType;
}

/**
 * Extends the parser context with default value handling functionality.
 *
 * @param options - The schema creator options containing the defaultMode
 * @returns An object containing the withDefault method
 */
export function extendParserContextWithDefaults(
  options: DefinitionSchemaCreatorOptions,
): WithDefaultContext {
  const mode = options.defaultMode ?? 'populate';

  return {
    withDefault: function withDefault<T extends z.ZodTypeAny>(
      schema: T,
      defaultValue: z.infer<T>,
    ): z.ZodEffects<z.ZodOptional<T>, z.output<z.ZodOptional<T>>, z.input<T>> {
      // Auto-add .optional() to the schema
      const optionalSchema = schema.optional();

      switch (mode) {
        case 'populate': {
          // Use preprocess to inject defaults before validation
          return z.preprocess((value: z.input<z.ZodOptional<T>>) => {
            if (value === undefined) {
              return defaultValue;
            }
            return value;
          }, optionalSchema);
        }
        case 'strip': {
          // Use transform to remove values matching defaults after validation
          return optionalSchema.transform((value) => {
            if (isEmpty(value)) {
              return undefined;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- it's typed to a generic
            return value;
          });
        }
        case 'preserve': {
          // Return schema with .optional() added
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- it's typed to a generic
          return optionalSchema.transform((x) => x);
        }
      }
    },
  };
}
