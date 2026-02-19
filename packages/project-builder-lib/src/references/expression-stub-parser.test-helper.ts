import { z } from 'zod';

import type { DefinitionEntityType } from './types.js';

import { RefExpressionParser } from './expression-types.js';

/**
 * A no-op stub parser for testing the expression infrastructure.
 *
 * This parser doesn't actually parse anything - it's used to verify
 * that the marker creation, collection, and flow work correctly
 * before implementing real parsers.
 *
 * @example
 * ```typescript
 * // Use in schema definition for testing
 * const schema = z.object({
 *   expression: ctx.withExpression(stubParser),
 * });
 * ```
 */
class StubParser extends RefExpressionParser<string, undefined> {
  readonly name = 'stub';

  createSchema(): z.ZodType<string> {
    return z.string();
  }

  parse(): undefined {
    // No-op - returns undefined as the parse result
    return undefined;
  }

  getWarnings(): [] {
    // No warnings from stub parser
    return [];
  }

  getDependencies(): [] {
    // No dependencies tracked by stub parser
    return [];
  }

  updateForRename(value: string): string {
    // No rename handling - return value unchanged
    return value;
  }
}

/**
 * Singleton instance of StubParser for convenience.
 */
export const stubParser = new StubParser();

/**
 * A stub parser that requires slots for testing slot resolution.
 *
 * This parser accepts a generic slots parameter to test that expression
 * slots are correctly resolved to their ancestor paths.
 *
 * @example
 * ```typescript
 * const modelType = createEntityType('model');
 * const parserWithSlots = new StubParserWithSlots<{ model: typeof modelType }>();
 *
 * ctx.refContext({ modelSlot: modelType }, ({ modelSlot }) =>
 *   z.object({
 *     condition: ctx.withExpression(parserWithSlots, { model: modelSlot }),
 *   })
 * );
 * ```
 */
export class StubParserWithSlots<
  TSlots extends Record<string, DefinitionEntityType>,
> extends RefExpressionParser<string, undefined, TSlots> {
  readonly name = 'stub-with-slots';
  createSchema(): z.ZodType<string> {
    return z.string();
  }

  parse(): undefined {
    return undefined;
  }

  getWarnings(): [] {
    return [];
  }

  getDependencies(): [] {
    return [];
  }

  updateForRename(value: string): string {
    return value;
  }
}
