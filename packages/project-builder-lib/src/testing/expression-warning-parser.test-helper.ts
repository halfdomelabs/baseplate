import { z } from 'zod';

import type {
  ExpressionValidationContext,
  RefExpressionWarning,
} from '#src/references/expression-types.js';

import { RefExpressionParser } from '#src/references/expression-types.js';

/**
 * A test parser that always returns a configurable set of warnings.
 *
 * Used to test expression validation infrastructure without needing
 * real expression parsing logic.
 *
 * @example
 * ```typescript
 * const parser = new WarningParser([{ message: 'Field not found' }]);
 * const schema = ctx.withExpression(parser);
 * ```
 */
export class WarningParser extends RefExpressionParser<string, string> {
  readonly name = 'warning-parser';
  private readonly warningsToReturn: RefExpressionWarning[];

  constructor(warnings: RefExpressionWarning[]) {
    super();
    this.warningsToReturn = warnings;
  }

  createSchema(): z.ZodType<string> {
    return z.string();
  }

  parse(value: string): string {
    return value;
  }

  getWarnings(
    _value: string,
    _parseResult: string,
    _context: ExpressionValidationContext,
  ): RefExpressionWarning[] {
    return this.warningsToReturn;
  }

  getDependencies(): [] {
    return [];
  }

  updateForRename(value: string): string {
    return value;
  }
}

/**
 * A test parser whose parse() always throws an error.
 *
 * Used to test that expression validation gracefully handles parse failures.
 */
export class ThrowingParser extends RefExpressionParser<string, never> {
  readonly name = 'throwing-parser';

  createSchema(): z.ZodType<string> {
    return z.string();
  }

  parse(): never {
    throw new Error('Parse failed');
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
