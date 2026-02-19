import { z } from 'zod';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type {
  RefExpressionDependency,
  RefExpressionWarning,
  ResolvedExpressionSlots,
} from '#src/references/expression-types.js';

import { RefExpressionParser } from '#src/references/expression-types.js';

import type { modelEntityType } from '../types.js';
import type { AuthorizerExpressionInfo } from './authorizer-expression-ast.js';

import { parseAuthorizerExpression } from './authorizer-expression-acorn-parser.js';
import { AuthorizerExpressionParseError } from './authorizer-expression-ast.js';
import { validateAuthorizerExpression } from './authorizer-expression-validator.js';

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
  AuthorizerExpressionInfo | undefined,
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
   * @param _projectDef - The project definition (unused during parsing)
   * @returns The parsed expression info, or undefined if parsing fails
   */
  parse(value: string): AuthorizerExpressionInfo | undefined {
    try {
      return parseAuthorizerExpression(value);
    } catch (error) {
      if (error instanceof AuthorizerExpressionParseError) {
        // Return undefined for parse errors - they'll be reported as warnings
        return undefined;
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
    value: string,
    parseResult: AuthorizerExpressionInfo | undefined,
    projectDef: unknown,
    resolvedSlots: ResolvedExpressionSlots<{ model: typeof modelEntityType }>,
  ): RefExpressionWarning[] {
    const warnings: RefExpressionWarning[] = [];

    // If parsing failed, report the error as a warning
    if (!parseResult) {
      try {
        parseAuthorizerExpression(value);
      } catch (error) {
        if (error instanceof AuthorizerExpressionParseError) {
          warnings.push({
            message: error.message,
          });
        }
      }
      return warnings;
    }

    // Cast to ProjectDefinitionContainer - the parser receives the container
    const container = projectDef as ProjectDefinitionContainer;

    // Get model context from resolved slots
    const modelContext = this.getModelContext(container, resolvedSlots);
    if (!modelContext) {
      // Can't validate without model context
      return warnings;
    }

    // Validate the expression (container provides role access via authConfigSpec)
    const validationWarnings = validateAuthorizerExpression(
      parseResult.ast,
      modelContext,
      container,
    );

    warnings.push(...validationWarnings);

    return warnings;
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
   * Extract model context from the project definition container using resolved slots.
   */
  private getModelContext(
    container: ProjectDefinitionContainer,
    resolvedSlots: ResolvedExpressionSlots<{ model: typeof modelEntityType }>,
  ): { modelName: string; scalarFieldNames: Set<string> } | undefined {
    const modelPath = resolvedSlots.model;
    if (modelPath.length === 0) {
      return undefined;
    }

    // Navigate to the model in the project definition
    // The path is like ['models', 0] for models[0]
    let current: unknown = container.definition;
    for (const segment of modelPath) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = (current as Record<string | number, unknown>)[segment];
    }

    const model = current as {
      name?: string;
      model?: { fields?: { name: string }[] };
    } | null;

    if (!model || typeof model.name !== 'string') {
      return undefined;
    }

    // Model fields are nested under model.model.fields in the definition
    const scalarFieldNames = new Set<string>();
    for (const field of model.model?.fields ?? []) {
      if (typeof field.name === 'string') {
        scalarFieldNames.add(field.name);
      }
    }

    return {
      modelName: model.name,
      scalarFieldNames,
    };
  }
}

/**
 * Singleton instance of AuthorizerExpressionParser.
 */
export const authorizerExpressionParser = new AuthorizerExpressionParser();
