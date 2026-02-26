import type { z } from 'zod';

import { definitionDefaultRegistry } from './definition-default-registry.js';

type WithDefaultResult<T extends z.ZodType> = z.ZodPrefault<T>;

export type WithDefaultType = <T extends z.ZodType>(
  schema: T,
  defaultValue: z.input<T>,
) => WithDefaultResult<T>;

/**
 * Creates a schema decorator that applies a default value.
 *
 * Uses `prefault` to ensure defaults are populated during Zod parse, and
 * registers the default value in the registry so `cleanDefaultValues()` can
 * strip matching values during serialization.
 *
 * Can be used standalone with `.apply()`:
 * ```typescript
 * z.boolean().apply(withDefault(false))
 * ```
 *
 * @param defaultValue - The default value to apply
 * @returns A function that decorates a schema with the default value
 */
export function withDefault(
  defaultValue: unknown,
): <T extends z.ZodType>(schema: T) => WithDefaultResult<T> {
  return <T extends z.ZodType>(schema: T): WithDefaultResult<T> => {
    const result = (schema as z.ZodType).prefault(defaultValue);
    definitionDefaultRegistry.set(result, { defaultValue });
    return result as WithDefaultResult<T>;
  };
}

/**
 * Extends the parser context with default value handling functionality.
 *
 * @returns An object containing the withDefault method
 */
export function extendParserContextWithDefaults(): {
  withDefault: WithDefaultType;
} {
  return {
    withDefault: (schema, defaultValue) => withDefault(defaultValue)(schema),
  };
}
