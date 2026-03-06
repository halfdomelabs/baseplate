import { z } from 'zod';

import type {
  ExpressionValidationContext,
  RefExpressionParseResult,
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

  parse(value: string): RefExpressionParseResult<string> {
    return { success: true, value };
  }

  getWarnings(
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
 * A test parser whose parse() returns a failure result.
 *
 * Used to test that expression validation gracefully handles parse failures.
 */
export class FailingParser extends RefExpressionParser<string, never> {
  readonly name = 'failing-parser';

  createSchema(): z.ZodType<string> {
    return z.string();
  }

  parse(): RefExpressionParseResult<never> {
    return { success: false, error: 'Parse failed' };
  }

  getWarnings(): RefExpressionWarning[] {
    // Never called — parse() always returns failure, handled by validate()
    return [];
  }

  getDependencies(): [] {
    return [];
  }

  updateForRename(value: string): string {
    return value;
  }
}
