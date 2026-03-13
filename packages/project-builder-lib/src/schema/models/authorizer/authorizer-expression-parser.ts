import { z } from 'zod';

import type {
  ExpressionValidationContext,
  RefExpressionDependency,
  RefExpressionParseResult,
  RefExpressionWarning,
  ResolvedExpressionSlots,
} from '#src/references/expression-types.js';

import { RefExpressionParser } from '#src/references/expression-types.js';

import type { modelEntityType } from '../types.js';
import type { AuthorizerExpressionInfo } from './authorizer-expression-ast.js';
import type { ModelValidationContext } from './authorizer-expression-validator.js';

import { parseAuthorizerExpression } from './authorizer-expression-acorn-parser.js';
import { AuthorizerExpressionParseError } from './authorizer-expression-ast.js';
import {
  buildRelationValidationInfo,
  validateAuthorizerExpression,
} from './authorizer-expression-validator.js';

/**
 * Shape of a raw model in the project definition JSON.
 * Used for navigating the untyped definition to extract relation and authorizer info.
 */
interface RawModelDefinition {
  name?: string;
  model?: {
    fields?: { name: string; type?: string }[];
    relations?: {
      name: string;
      modelRef: string;
      references?: { localRef: string; foreignRef: string }[];
    }[];
  };
  authorizer?: {
    roles?: { name: string }[];
  };
}

/**
 * Expression parser for model authorizer role expressions.
 *
 * Parses expressions like:
 * - `model.id === auth.userId` (ownership check)
 * - `auth.hasRole('admin')` (global role check)
 * - `model.id === auth.userId || auth.hasRole('admin')` (combined)
 *
 * Uses Acorn to parse JavaScript expressions and validates
 * that only supported constructs are used.
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
  AuthorizerExpressionInfo,
  { model: typeof modelEntityType }
> {
  readonly name = 'authorizer-expression';

  /**
   * Creates a Zod schema for validating expression strings.
   * Requires a non-empty string value.
   */
  createSchema(): z.ZodType<string> {
    return z.string().min(1, 'Expression is required');
  }

  /**
   * Parse the expression string into an AST.
   *
   * @param value - The expression string
   * @returns Success with parsed expression info, or failure with error message
   */
  parse(value: string): RefExpressionParseResult<AuthorizerExpressionInfo> {
    try {
      return { success: true, value: parseAuthorizerExpression(value) };
    } catch (error) {
      if (error instanceof AuthorizerExpressionParseError) {
        return { success: false, error: error.message };
      }
      throw error;
    }
  }

  /**
   * Get validation warnings for the expression.
   *
   * Validates:
   * - Syntax errors from parsing
   * - Model field references exist
   * - Auth field references are valid
   * - Role names exist in project config (warning only)
   */
  getWarnings(
    parseResult: AuthorizerExpressionInfo,
    context: ExpressionValidationContext,
    resolvedSlots: ResolvedExpressionSlots<{ model: typeof modelEntityType }>,
  ): RefExpressionWarning[] {
    // Get model context from resolved slots
    const modelContext = this.getModelContext(
      context.definition,
      resolvedSlots,
    );
    if (!modelContext) {
      // Can't validate without model context
      return [];
    }

    // Validate the expression against model fields and roles
    return validateAuthorizerExpression(
      parseResult.ast,
      modelContext,
      context.pluginStore,
      context.definition,
    );
  }

  /**
   * Get entity/field dependencies from the expression.
   *
   * Currently returns empty array as we don't yet track
   * entity-level dependencies (just field names).
   * Future: could track model field entity references for renames.
   */
  getDependencies(): RefExpressionDependency[] {
    // TODO: Track model field entities for rename support
    return [];
  }

  /**
   * Update the expression when dependencies are renamed.
   *
   * Currently returns value unchanged as we don't yet
   * support field renames in expressions.
   */
  updateForRename(value: string): string {
    // TODO: Implement rename support using AST position info
    return value;
  }

  /**
   * Extract model context from the project definition using resolved slots.
   */
  private getModelContext(
    definition: unknown,
    resolvedSlots: ResolvedExpressionSlots<{ model: typeof modelEntityType }>,
  ):
    | (ModelValidationContext & {
        relationInfo: ReturnType<typeof buildRelationValidationInfo>;
      })
    | undefined {
    const modelPath = resolvedSlots.model;
    if (modelPath.length === 0) {
      return undefined;
    }

    // Navigate to the model in the project definition
    // The path is like ['models', 0] for models[0]
    let current: unknown = definition;
    for (const segment of modelPath) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = (current as Record<string | number, unknown>)[segment];
    }

    const model = current as RawModelDefinition | null;

    if (!model || typeof model.name !== 'string') {
      return undefined;
    }

    // Model fields are nested under model.model.fields in the definition
    const scalarFieldNames = new Set<string>();
    const fieldTypes = new Map<string, string>();
    for (const field of model.model?.fields ?? []) {
      if (typeof field.name === 'string') {
        scalarFieldNames.add(field.name);
        if (typeof field.type === 'string') {
          fieldTypes.set(field.name, field.type);
        }
      }
    }

    // Build relation info for nested authorizer validation
    const relations = (model.model?.relations ?? []).filter(
      (
        r,
      ): r is {
        name: string;
        modelRef: string;
        references?: { localRef: string; foreignRef: string }[];
      } => typeof r.name === 'string' && typeof r.modelRef === 'string',
    );

    const allModels = (
      (definition as { models?: RawModelDefinition[] }).models ?? []
    ).filter(
      (m): m is RawModelDefinition & { name: string } =>
        typeof m.name === 'string',
    );

    const relationInfo = buildRelationValidationInfo(
      relations.map((r) => ({
        name: r.name,
        modelRef: r.modelRef,
        references: r.references ?? [],
      })),
      allModels.map((m) => ({
        name: m.name,
        authorizer: m.authorizer,
      })),
    );

    return {
      modelName: model.name,
      scalarFieldNames,
      fieldTypes,
      relationInfo,
    };
  }
}

/**
 * Singleton instance of AuthorizerExpressionParser.
 */
export const authorizerExpressionParser = new AuthorizerExpressionParser();
