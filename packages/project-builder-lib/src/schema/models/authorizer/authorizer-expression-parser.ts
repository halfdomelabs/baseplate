import { RefExpressionParser } from '#src/references/expression-types.js';

import type { modelEntityType } from '../types.js';

/**
 * Expression parser for model authorizer role expressions.
 *
 * Expressions can reference:
 * - `model` - The model instance being authorized
 * - `auth` - The AuthContext from ServiceContext
 *
 * Example expressions:
 * - `model.id === auth.userId` (ownership check)
 * - `auth.hasRole('admin')` (global role check)
 * - `model.organizationId === auth.organizationId` (org-level access)
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   expression: ctx.withExpression(authorizerExpressionParser, { model: modelSlot }),
 * });
 * ```
 */
export class AuthorizerExpressionParser extends RefExpressionParser<
  string,
  undefined,
  { model: typeof modelEntityType }
> {
  readonly name = 'authorizer-expression';

  /**
   * Parse the expression string.
   * For Phase 1, this is a stub that returns undefined.
   * Future implementation will parse TypeScript and extract dependencies.
   */
  parse(_value: string, _projectDef: unknown): undefined {
    return undefined;
  }

  /**
   * Get validation warnings for the expression.
   * For Phase 1, returns empty array.
   * Future: validate that expression uses valid model fields and auth properties.
   */
  getWarnings(): [] {
    return [];
  }

  /**
   * Get entity/field dependencies from the expression.
   * For Phase 1, returns empty array.
   * Future: track model field dependencies for rename handling.
   */
  getDependencies(): [] {
    return [];
  }

  /**
   * Update the expression when dependencies are renamed.
   * For Phase 1, returns value unchanged.
   * Future: update model field references when fields are renamed.
   */
  updateForRename(value: string): string {
    return value;
  }
}

/**
 * Singleton instance of AuthorizerExpressionParser.
 */
export const authorizerExpressionParser = new AuthorizerExpressionParser();
