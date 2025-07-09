import type { DefinitionSchemaParserContext } from '../creator/types.js';

export type DefaultMode = 'populate' | 'strip' | 'preserve';

function isEmpty(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).every((val) => val === undefined);
  }
  return value === false || value === '';
}

/**
 * Given a context, creates a function that handles default values based on the specified mode.
 *
 * @param ctx - The schema parser context.
 * @returns A function that transforms values based on the default mode:
 *   - 'populate': Ensures defaults are present (useful for React Hook Form)
 *   - 'strip': Removes values that match their defaults (useful for clean JSON)
 *   - 'preserve': Keeps values as-is without transformation
 */
export function createDefaultHandler<T>(
  ctx: DefinitionSchemaParserContext,
  defaultValue: T,
): <TValue>(value: T | undefined extends TValue ? TValue : never) => TValue {
  const mode = ctx.defaultMode ?? 'populate';

  return <TValue>(value: TValue): TValue => {
    switch (mode) {
      case 'strip': {
        if (isEmpty(value)) {
          return undefined as TValue;
        }
        return value;
      }
      case 'populate': {
        if (value === undefined || value === null) {
          return defaultValue as unknown as TValue;
        }
        return value;
      }
      default: {
        return value;
      }
    }
  };
}
