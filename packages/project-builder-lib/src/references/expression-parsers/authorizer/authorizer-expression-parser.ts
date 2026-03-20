import { z } from 'zod';

import type {
  ExpressionValidationContext,
  RefExpressionDependency,
  RefExpressionParseResult,
  RefExpressionWarning,
  ResolvedExpressionSlots,
} from '#src/references/expression-types.js';
import type { ModelConfig } from '#src/schema/models/models.js';
import type { modelEntityType } from '#src/schema/models/types.js';
import type { ProjectDefinition } from '#src/schema/project-definition.js';

import { RefExpressionParser } from '#src/references/expression-types.js';
import { modelAuthorizerRoleEntityType } from '#src/schema/models/authorizer/types.js';
import {
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from '#src/schema/models/types.js';

import type { AuthorizerExpressionInfo } from './authorizer-expression-ast.js';
import type { ModelValidationContext } from './authorizer-expression-validator.js';
import type { AuthorizerExpressionVisitor } from './authorizer-expression-visitor.js';

import { parseAuthorizerExpression } from './authorizer-expression-acorn-parser.js';
import { AuthorizerExpressionParseError } from './authorizer-expression-ast.js';
import {
  buildModelExpressionContext,
  validateAuthorizerExpression,
} from './authorizer-expression-validator.js';
import { visitAuthorizerExpression } from './authorizer-expression-visitor.js';

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
    // Get model context from resolved slots (throws if model not found)
    const modelContext = this.getModelContext(
      context.definition,
      resolvedSlots,
    );

    // Validate the expression against model fields and roles
    return validateAuthorizerExpression(
      parseResult.ast,
      modelContext,
      context.pluginStore,
      context.definition,
    );
  }

  /**
   * Get entity references from the expression with their positions.
   *
   * Walks the AST and resolves each name reference (field, relation, role)
   * to its entity ID by navigating the model definition from the resolved slots.
   * Returns positions marking exactly which text to replace when an entity is renamed.
   */
  getReferencedEntities(
    _value: string,
    parseResult: RefExpressionParseResult<AuthorizerExpressionInfo>,
    definition: ProjectDefinition,
    resolvedSlots: ResolvedExpressionSlots<{ model: typeof modelEntityType }>,
  ): RefExpressionDependency[] {
    if (!parseResult.success) {
      return [];
    }

    const model = this.getRawModel(definition, resolvedSlots);

    const allModels = (definition.models ?? []).filter(
      (m): m is ModelConfig => typeof m.name === 'string',
    );

    // Build lookup maps
    const fieldByName = new Map<string, { id: string }>();
    for (const field of model.model?.fields ?? []) {
      if (field.id) {
        fieldByName.set(field.name, { id: field.id });
      }
    }

    const relationByName = new Map<string, { id: string; modelRef: string }>();
    for (const relation of model.model?.relations ?? []) {
      if (relation.id) {
        relationByName.set(relation.name, {
          id: relation.id,
          modelRef: relation.modelRef,
        });
      }
    }

    const modelById = new Map<string, ModelConfig>();
    for (const m of allModels) {
      if (m.id) {
        modelById.set(m.id, m);
      }
    }

    const deps: RefExpressionDependency[] = [];

    const visitor: AuthorizerExpressionVisitor<void> = {
      fieldComparison(node) {
        for (const side of [node.left, node.right]) {
          if (side.type === 'fieldRef' && side.source === 'model') {
            const field = fieldByName.get(side.field);
            if (field) {
              deps.push({
                entityType: modelScalarFieldEntityType,
                entityId: field.id,
                start: side.end - side.field.length,
                end: side.end,
              });
            }
          }
        }
      },
      hasRole() {
        // Global auth roles are defined by plugins, not navigable from
        // the raw model definition. Skip — auth role renames are rare
        // and would require traversing plugin-specific config.
      },
      hasSomeRole() {
        // Same as hasRole — skip global auth role references
      },
      nestedHasRole(node) {
        const relation = relationByName.get(node.relationName);
        if (relation) {
          deps.push({
            entityType: modelLocalRelationEntityType,
            entityId: relation.id,
            start: node.relationEnd - node.relationName.length,
            end: node.relationEnd,
          });
          // Foreign authorizer role
          const foreignModel = modelById.get(relation.modelRef);
          const foreignRole = foreignModel?.authorizer?.roles?.find(
            (r) => r.name === node.role,
          );
          if (foreignRole?.id) {
            deps.push({
              entityType: modelAuthorizerRoleEntityType,
              entityId: foreignRole.id,
              start: node.roleStart + 1,
              end: node.roleEnd - 1,
            });
          }
        }
      },
      nestedHasSomeRole(node) {
        const relation = relationByName.get(node.relationName);
        if (relation) {
          deps.push({
            entityType: modelLocalRelationEntityType,
            entityId: relation.id,
            start: node.relationEnd - node.relationName.length,
            end: node.relationEnd,
          });
          const foreignModel = modelById.get(relation.modelRef);
          if (foreignModel?.authorizer?.roles) {
            const foreignRoleByName = new Map(
              foreignModel.authorizer.roles
                .filter((r) => r.id)
                .map((r) => [r.name, r]),
            );
            for (let i = 0; i < node.roles.length; i++) {
              const foreignRole = foreignRoleByName.get(node.roles[i]);
              if (foreignRole?.id) {
                deps.push({
                  entityType: modelAuthorizerRoleEntityType,
                  entityId: foreignRole.id,
                  start: node.rolesStart[i] + 1,
                  end: node.rolesEnd[i] - 1,
                });
              }
            }
          }
        }
      },
      relationFilter(node) {
        const relation = relationByName.get(node.relationName);
        if (relation) {
          deps.push({
            entityType: modelLocalRelationEntityType,
            entityId: relation.id,
            start: node.relationEnd - node.relationName.length,
            end: node.relationEnd,
          });
          // Foreign model fields referenced in conditions
          const foreignModel = modelById.get(relation.modelRef);
          const foreignFieldByName = new Map<string, { id: string }>();
          for (const f of foreignModel?.model?.fields ?? []) {
            if (f.id) {
              foreignFieldByName.set(f.name, { id: f.id });
            }
          }
          for (const condition of node.conditions) {
            // Condition key references a field on the foreign model
            const foreignField = foreignFieldByName.get(condition.field);
            if (foreignField) {
              deps.push({
                entityType: modelScalarFieldEntityType,
                entityId: foreignField.id,
                start: condition.fieldStart,
                end: condition.fieldEnd,
              });
            }
            // Condition value may be a model field ref
            if (
              condition.value.type === 'fieldRef' &&
              condition.value.source === 'model'
            ) {
              const field = fieldByName.get(condition.value.field);
              if (field) {
                deps.push({
                  entityType: modelScalarFieldEntityType,
                  entityId: field.id,
                  start: condition.value.end - condition.value.field.length,
                  end: condition.value.end,
                });
              }
            }
          }
        }
      },
      isAuthenticated() {
        // No entity references
      },
      binaryLogical(_node, _ctx, visit) {
        visit(_node.left);
        visit(_node.right);
      },
    };

    visitAuthorizerExpression(parseResult.value.ast, visitor);

    return deps;
  }

  /**
   * Navigate to the raw model object from the definition using resolved slots.
   *
   * Resolved slot paths point to the entity's ID field (e.g., `['models', 2, 'id']`),
   * so we walk parent paths until we find an object with a string `name` property.
   */
  private getRawModel(
    definition: ProjectDefinition,
    resolvedSlots: ResolvedExpressionSlots<{ model: typeof modelEntityType }>,
  ): ModelConfig {
    const modelPath = resolvedSlots.model;

    // Walk progressively shorter paths to find the model object.
    // Slot paths include the idPath suffix (e.g., ['models', 2, 'id']),
    // so we try the full path first, then strip segments until we find
    // an object with a name property.
    for (let len = modelPath.length; len > 0; len--) {
      let current: unknown = definition;
      for (let i = 0; i < len; i++) {
        if (current === null || current === undefined) {
          break;
        }
        current = (current as Record<string | number, unknown>)[modelPath[i]];
      }
      if (
        current !== null &&
        current !== undefined &&
        typeof current === 'object' &&
        'name' in current &&
        typeof (current as Record<string, unknown>).name === 'string'
      ) {
        return current as ModelConfig;
      }
    }

    throw new Error(`Could not resolve model at path ${modelPath.join('.')}`);
  }

  /**
   * Extract model context from the project definition using resolved slots.
   */
  private getModelContext(
    definition: ProjectDefinition,
    resolvedSlots: ResolvedExpressionSlots<{ model: typeof modelEntityType }>,
  ): ModelValidationContext {
    const model = this.getRawModel(definition, resolvedSlots);

    const allModels = (definition.models ?? []).filter(
      (m): m is ModelConfig => typeof m.name === 'string',
    );

    return buildModelExpressionContext(
      {
        id: model.id,
        name: model.name,
        fields: model.model?.fields,
        model: { relations: model.model?.relations },
      },
      allModels.map((m) => ({
        id: m.id,
        name: m.name,
        authorizer: m.authorizer,
        fields: m.model?.fields,
        model: { relations: m.model?.relations },
      })),
    );
  }
}

/**
 * Singleton instance of AuthorizerExpressionParser.
 */
export const authorizerExpressionParser = new AuthorizerExpressionParser();
