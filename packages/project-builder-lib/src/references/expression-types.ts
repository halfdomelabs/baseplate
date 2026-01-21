import type { RefContextSlot } from './ref-context-slot.js';
import type { DefinitionEntityType, ReferencePath } from './types.js';

/**
 * A warning from validating a ref expression.
 * Warnings are non-blocking - they don't prevent loading the project definition.
 */
export interface RefExpressionWarning {
  /** Warning message */
  message: string;
  /** Path within the expression where the warning occurred */
  expressionPath?: string;
  /** Start position in the expression for inline highlighting */
  start?: number;
  /** End position in the expression for inline highlighting */
  end?: number;
}

/**
 * A dependency found in a ref expression.
 * Used for tracking which entities the expression references,
 * enabling rename handling.
 */
export interface RefExpressionDependency {
  /** The type of entity being referenced */
  entityType: DefinitionEntityType;
  /** The ID of the entity being referenced */
  entityId: string;
  /** Position in the expression for rename updates */
  start?: number;
  end?: number;
}

/**
 * Slot map type for expressions - maps slot keys to RefContextSlot instances.
 * Similar to RefContextSlotMap but used for expression parser slots.
 */
export type ExpressionSlotMap<
  T extends Record<string, DefinitionEntityType> = Record<string, never>,
> = {
  [K in keyof T]: RefContextSlot<T[K]>;
};

/**
 * Resolved slot paths after slot resolution.
 * Maps slot keys to their resolved paths in the definition.
 */
export type ResolvedExpressionSlots<
  T extends Record<string, DefinitionEntityType> = Record<string, never>,
> = {
  [K in keyof T]: ReferencePath;
};

/**
 * A pluggable parser for ref expressions.
 *
 * The parser is format-agnostic - the core references system
 * doesn't know or care what format the expressions are in. The parser
 * handles all parsing, validation, and rename handling.
 *
 * Parsers can declare required slots via the TRequiredSlots generic parameter.
 * When a parser requires slots, TypeScript enforces that they are provided
 * when calling `withExpression()`.
 *
 * @typeParam TValue - The type of the raw expression value (e.g., string for TS expressions)
 * @typeParam TParseResult - The type of the parsed result (e.g., AST for TS expressions)
 * @typeParam TRequiredSlots - Record of required slot names to entity types
 *
 * @example
 * ```typescript
 * // A simple parser with no required slots
 * class StubParser extends RefExpressionParser<string, undefined> {
 *   readonly name = 'stub';
 *   parse(): undefined { return undefined; }
 *   getWarnings(): [] { return []; }
 *   getDependencies(): [] { return []; }
 *   updateForRename(value: string): string { return value; }
 * }
 *
 * // A parser that requires a model slot
 * class AuthorizerParser extends RefExpressionParser<
 *   string,
 *   TsAst,
 *   { model: typeof modelEntityType }
 * > {
 *   readonly name = 'authorizer';
 *   // TypeScript enforces slot requirement in withExpression()
 * }
 * ```
 */
export abstract class RefExpressionParser<
  TValue = unknown,
  TParseResult = unknown,
  TRequiredSlots extends Record<string, DefinitionEntityType> = Record<
    string,
    never
  >,
> {
  /** Unique name for this parser type (used for serialization) */
  abstract readonly name: string;

  /**
   * Parse the raw value and return the parse result.
   * The result is cached on the marker for subsequent operations.
   *
   * @param value - The raw expression value
   * @param projectDef - The project definition for context (typed as unknown to avoid circular reference)
   * @returns The parsed result (type determined by parser)
   */
  abstract parse(value: TValue, projectDef: unknown): TParseResult;

  /**
   * Get validation warnings for the expression.
   * Warnings are non-blocking - they don't prevent loading.
   *
   * @param value - The raw expression value
   * @param parseResult - The cached parse result
   * @param projectDef - The project definition for validation context (typed as unknown to avoid circular reference)
   * @param resolvedSlots - The resolved slot paths for this expression
   * @returns Array of warnings (empty if valid)
   */
  abstract getWarnings(
    value: TValue,
    parseResult: TParseResult,
    projectDef: unknown,
    resolvedSlots: ResolvedExpressionSlots<TRequiredSlots>,
  ): RefExpressionWarning[];

  /**
   * Get entity/field dependencies from the expression.
   * Used for tracking what the expression references for rename handling.
   *
   * @param value - The raw expression value
   * @param parseResult - The cached parse result
   * @returns Array of dependencies
   */
  abstract getDependencies(
    value: TValue,
    parseResult: TParseResult,
  ): RefExpressionDependency[];

  /**
   * Update the expression when dependencies are renamed.
   *
   * @param value - The raw expression value
   * @param parseResult - The cached parse result
   * @param renames - Map of old entity ID to new name
   * @returns The updated expression value
   */
  abstract updateForRename(
    value: TValue,
    parseResult: TParseResult,
    renames: Map<string, string>,
  ): TValue;

  /**
   * Phantom property for TRequiredSlots type inference.
   * This is never actually used at runtime.
   * @internal
   */
  readonly _requiredSlots?: TRequiredSlots;
}

/**
 * Fully resolved expression - output from extractDefinitionRefs.
 * Contains the expression value, parser instance, and resolved slot paths.
 */
export interface DefinitionExpression {
  /** Path to the expression in the definition */
  path: ReferencePath;
  /** The raw expression value */
  value: unknown;
  /** Reference to the parser that handles this expression */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parser: RefExpressionParser<any, any, any>;
  /** Resolved slot paths (slot key → resolved path in definition) */
  resolvedSlots: Record<string, ReferencePath>;
}
