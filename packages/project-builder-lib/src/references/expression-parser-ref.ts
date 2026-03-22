import type { z } from 'zod';

import type { DefinitionEntityType } from './types.js';

/**
 * A lightweight reference to an expression parser registered in the
 * `expressionParserSpec`.
 *
 * Used in schema definitions instead of importing the full parser class
 * directly. The actual parser is resolved at runtime during schema+data
 * walking via the plugin spec store.
 *
 * Phantom type parameters enforce slot requirements at compile time
 * without requiring the parser implementation to be imported.
 *
 * @typeParam TValue - The type of the raw expression value (e.g., string)
 * @typeParam TRequiredSlots - Record of required slot names to entity types
 *
 * @example
 * ```typescript
 * const authorizerExpressionRef = createExpressionParserRef<
 *   string,
 *   { model: typeof modelEntityType }
 * >(
 *   'authorizer-expression',
 *   () => z.string().min(1, 'Expression is required'),
 * );
 * ```
 */
export interface ExpressionParserRef<
  TValue = unknown,
  TRequiredSlots extends Record<string, DefinitionEntityType> = Record<
    string,
    never
  >,
> {
  /** Unique name matching the parser registered in expressionParserSpec */
  readonly name: string;
  /**
   * Creates a fresh Zod schema instance for basic validation.
   * Must return a new instance per call to avoid shared metadata conflicts
   * when the same ref is used at multiple schema sites.
   */
  readonly createSchema: () => z.ZodType<TValue, TValue>;
  /** @internal Phantom type for slot enforcement */
  readonly _slots?: TRequiredSlots;
}

/**
 * Creates a typed reference to an expression parser.
 *
 * The ref carries a parser name and a schema factory for basic value validation.
 * The actual parser implementation is looked up from `expressionParserSpec`
 * at runtime.
 *
 * @param name - Unique name matching the registered parser
 * @param createSchema - Factory that returns a fresh Zod schema per call site
 */
export function createExpressionParserRef<
  TValue,
  TRequiredSlots extends Record<string, DefinitionEntityType> = Record<
    string,
    never
  >,
>(
  name: string,
  createSchema: () => z.ZodType<TValue, TValue>,
): ExpressionParserRef<TValue, TRequiredSlots> {
  return { name, createSchema };
}
