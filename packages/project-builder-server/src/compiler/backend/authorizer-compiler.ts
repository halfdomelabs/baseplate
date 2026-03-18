import type {
  AuthorizerExpressionNode,
  AuthorizerExpressionVisitor,
  ModelConfig,
} from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import { prismaModelAuthorizerGenerator } from '@baseplate-dev/fastify-generators';
import {
  ModelUtils,
  parseAuthorizerExpression,
  visitAuthorizerExpression,
} from '@baseplate-dev/project-builder-lib';
import { lowercaseFirstChar } from '@baseplate-dev/utils';

import type { BackendAppEntryBuilder } from '../app-entry-builder.js';

import { generateFieldRefOrLiteralCode } from './authorizer-expression-codegen-utils.js';

/**
 * Resolved information about a relation for nested authorizer code generation.
 */
interface ResolvedNestedRelation {
  /** The local FK field name (e.g., 'todoListId') */
  localFkFieldName: string;
  /** The foreign model name (e.g., 'TodoList') */
  foreignModelName: string;
  /** The foreign authorizer variable name (e.g., 'todoListAuthorizer') */
  foreignAuthorizerVar: string;
}

/**
 * Resolved information about a relation for relation filter code generation.
 */
interface ResolvedRelationFilter {
  /** The Prisma model accessor (e.g., 'brandMember') */
  prismaAccessor: string;
  /** The FK field on the foreign model that points back (e.g., 'brandId') */
  foreignKeyFieldName: string;
  /** The local field to match against (e.g., 'id') */
  localFieldName: string;
}

/**
 * Context for generating authorizer expression code with relation resolution.
 */
interface AuthorizerExpressionCodeContext {
  /** Map of relation name → resolved nested relation info */
  resolvedRelations: Map<string, ResolvedNestedRelation>;
  /** Map of relation name → resolved relation filter info */
  resolvedRelationFilters: Map<string, ResolvedRelationFilter>;
}

/**
 * Build a visitor that generates TypeScript boolean-check code from
 * authorizer expression AST nodes.
 *
 * Transforms the implicit-context DSL into explicit context code:
 * - `model.field` stays as `model.field`
 * - `userId` (auth field) becomes `ctx.auth.userId`
 * - `hasRole('admin')` becomes `ctx.auth.hasRole('admin')`
 * - `hasSomeRole(['a', 'b'])` becomes `ctx.auth.hasSomeRole(['a', 'b'])`
 * - `hasRole(model.relation, 'role')` becomes `await foreignAuthorizer.hasRoleById(ctx, model.fkField, 'role')`
 * - `A || B` becomes `(A) || (B)`
 */
function createAuthorizerCodeVisitor(
  codeContext?: AuthorizerExpressionCodeContext,
): AuthorizerExpressionVisitor<string> {
  return {
    fieldComparison(node) {
      const left = generateFieldRefOrLiteralCode(node.left);
      const right = generateFieldRefOrLiteralCode(node.right);
      return `${left} ${node.operator} ${right}`;
    },
    hasRole(node) {
      return `ctx.auth.hasRole('${node.role}')`;
    },
    hasSomeRole(node) {
      const roles = node.roles.map((r: string) => `'${r}'`).join(', ');
      return `ctx.auth.hasSomeRole([${roles}])`;
    },
    nestedHasRole(node) {
      const resolved = getResolvedRelation(codeContext, node.relationName);
      return `await ${resolved.foreignAuthorizerVar}.hasRoleById(ctx, model.${resolved.localFkFieldName}, '${node.role}')`;
    },
    nestedHasSomeRole(node) {
      const resolved = getResolvedRelation(codeContext, node.relationName);
      const checks = node.roles.map(
        (role) =>
          `await ${resolved.foreignAuthorizerVar}.hasRoleById(ctx, model.${resolved.localFkFieldName}, '${role}')`,
      );
      return checks.length === 1 ? checks[0] : `(${checks.join(' || ')})`;
    },
    relationFilter(node) {
      return generateRelationFilterCode(node, codeContext);
    },
    isAuthenticated() {
      return 'ctx.auth.isAuthenticated';
    },
    binaryLogical(node, _ctx, visit) {
      const left = visit(node.left);
      const right = visit(node.right);
      return `(${left}) ${node.operator} (${right})`;
    },
  };
}

/**
 * Generate TypeScript code from an authorizer expression AST node.
 */
export function generateAuthorizerExpressionCode(
  node: AuthorizerExpressionNode,
  codeContext?: AuthorizerExpressionCodeContext,
): string {
  return visitAuthorizerExpression(
    node,
    createAuthorizerCodeVisitor(codeContext),
  );
}

/**
 * Get the resolved relation info from the code context, throwing if not found.
 */
function getResolvedRelation(
  codeContext: AuthorizerExpressionCodeContext | undefined,
  relationName: string,
): ResolvedNestedRelation {
  if (!codeContext) {
    throw new Error(
      `Nested authorizer expression references relation '${relationName}' but no code context was provided`,
    );
  }
  const resolved = codeContext.resolvedRelations.get(relationName);
  if (!resolved) {
    throw new Error(
      `Nested authorizer expression references relation '${relationName}' which was not resolved`,
    );
  }
  return resolved;
}

/**
 * Generate code for a relation filter expression (exists/all).
 *
 * For `exists` (some): checks if any related record matches conditions.
 * For `all` (every): checks if no related record fails conditions.
 */
function generateRelationFilterCode(
  node: Extract<AuthorizerExpressionNode, { type: 'relationFilter' }>,
  codeContext: AuthorizerExpressionCodeContext | undefined,
): string {
  const resolved = getResolvedRelationFilter(codeContext, node.relationName);

  // Build the condition entries
  const conditionEntries = node.conditions.map((condition) => {
    const valueCode = generateFieldRefOrLiteralCode(condition.value);
    return `${condition.field}: ${valueCode}`;
  });

  // Check if any condition references an auth field (needs null guard)
  const authFieldConditions = node.conditions.filter(
    (c) => c.value.type === 'fieldRef' && c.value.source === 'auth',
  );

  const fkCondition = `${resolved.foreignKeyFieldName}: model.${resolved.localFieldName}`;
  const allConditions = [fkCondition, ...conditionEntries].join(', ');

  if (node.operator === 'some') {
    const countExpr = `(await prisma.${resolved.prismaAccessor}.count({ where: { ${allConditions} } })) > 0`;
    if (authFieldConditions.length > 0) {
      // Null guard: if any auth field is null, the filter can't match
      const nullChecks = authFieldConditions
        .map((c) => `${generateFieldRefOrLiteralCode(c.value)} != null`)
        .join(' && ');
      return `(${nullChecks} ? ${countExpr} : false)`;
    }
    return countExpr;
  }

  // operator === 'every': count records that DON'T match, expect 0
  const notConditions = conditionEntries.join(', ');
  const everyExpr = `(await prisma.${resolved.prismaAccessor}.count({ where: { ${fkCondition}, NOT: { ${notConditions} } } })) === 0`;
  if (authFieldConditions.length > 0) {
    const nullChecks = authFieldConditions
      .map((c) => `${generateFieldRefOrLiteralCode(c.value)} != null`)
      .join(' && ');
    return `(${nullChecks} ? ${everyExpr} : false)`;
  }
  return everyExpr;
}

/**
 * Get the resolved relation filter info from the code context, throwing if not found.
 */
function getResolvedRelationFilter(
  codeContext: AuthorizerExpressionCodeContext | undefined,
  relationName: string,
): ResolvedRelationFilter {
  if (!codeContext) {
    throw new Error(
      `Relation filter expression references relation '${relationName}' but no code context was provided`,
    );
  }
  const resolved = codeContext.resolvedRelationFilters.get(relationName);
  if (!resolved) {
    throw new Error(
      `Relation filter expression references relation '${relationName}' which was not resolved`,
    );
  }
  return resolved;
}

/**
 * Resolve relation info for nested authorizer expressions on a model.
 */
function resolveNestedRelations(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
  nestedRoleRefs: { relationName: string; roles: string[] }[],
): {
  resolvedRelations: Map<string, ResolvedNestedRelation>;
  foreignModelNames: string[];
} {
  const resolvedRelations = new Map<string, ResolvedNestedRelation>();
  const foreignModelNames: string[] = [];

  for (const { relationName } of nestedRoleRefs) {
    if (resolvedRelations.has(relationName)) {
      continue;
    }

    const relation = model.model.relations.find((r) => r.name === relationName);
    if (!relation) {
      throw new Error(
        `Relation '${relationName}' not found on model '${model.name}'`,
      );
    }

    if (relation.references.length !== 1) {
      throw new Error(
        `Relation '${relationName}' on model '${model.name}' has ${relation.references.length} foreign key references. Nested authorizer checks only support single-key relations.`,
      );
    }

    const localFkFieldName = appBuilder.nameFromId(
      relation.references[0].localRef,
    );
    if (!localFkFieldName) {
      throw new Error(
        `Could not resolve local FK field for relation '${relationName}' on model '${model.name}'`,
      );
    }

    const foreignModel = ModelUtils.byIdOrThrow(
      appBuilder.projectDefinition,
      relation.modelRef,
    );
    const foreignModelName = foreignModel.name;
    const foreignAuthorizerVar = `${lowercaseFirstChar(foreignModelName)}Authorizer`;

    resolvedRelations.set(relationName, {
      localFkFieldName,
      foreignModelName,
      foreignAuthorizerVar,
    });

    if (!foreignModelNames.includes(foreignModelName)) {
      foreignModelNames.push(foreignModelName);
    }
  }

  return { resolvedRelations, foreignModelNames };
}

/**
 * Resolve a local relation for relation filter (FK is on this model).
 * localRef = field on this model, foreignRef = field on the foreign model.
 */
function resolveLocalRelationFilter(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
  relation: ModelConfig['model']['relations'][number],
): ResolvedRelationFilter {
  if (relation.references.length !== 1) {
    throw new Error(
      `Relation '${relation.name}' on model '${model.name}' has ${relation.references.length} FK references. Relation filters only support single-key relations.`,
    );
  }

  const foreignKeyFieldName = appBuilder.nameFromId(
    relation.references[0].foreignRef,
  );
  if (!foreignKeyFieldName) {
    throw new Error(
      `Could not resolve foreign FK field for relation '${relation.name}' on model '${model.name}'`,
    );
  }

  const localFieldName = appBuilder.nameFromId(relation.references[0].localRef);
  if (!localFieldName) {
    throw new Error(
      `Could not resolve local field for relation '${relation.name}' on model '${model.name}'`,
    );
  }

  const foreignModel = ModelUtils.byIdOrThrow(
    appBuilder.projectDefinition,
    relation.modelRef,
  );

  return {
    prismaAccessor: lowercaseFirstChar(foreignModel.name),
    foreignKeyFieldName,
    localFieldName,
  };
}

/**
 * Resolve a foreign/reverse relation for relation filter (FK is on the other model).
 * The relation is defined on otherModel, so:
 * - localRef = FK field on otherModel (becomes foreignKeyFieldName)
 * - foreignRef = join field on current model (becomes localFieldName)
 */
function resolveForeignRelationFilter(
  appBuilder: BackendAppEntryBuilder,
  otherModel: ModelConfig,
  relation: ModelConfig['model']['relations'][number],
): ResolvedRelationFilter {
  if (relation.references.length !== 1) {
    throw new Error(
      `Foreign relation '${relation.foreignRelationName}' (via ${otherModel.name}.${relation.name}) has ${relation.references.length} FK references. Relation filters only support single-key relations.`,
    );
  }

  // For foreign relations, the mapping is inverted:
  // localRef on the relation = FK on the other model (e.g., blogId on BlogPost)
  // foreignRef on the relation = join field on the current model (e.g., id on Blog)
  const foreignKeyFieldName = appBuilder.nameFromId(
    relation.references[0].localRef,
  );
  if (!foreignKeyFieldName) {
    throw new Error(
      `Could not resolve FK field for foreign relation '${relation.foreignRelationName}' on model '${otherModel.name}'`,
    );
  }

  const localFieldName = appBuilder.nameFromId(
    relation.references[0].foreignRef,
  );
  if (!localFieldName) {
    throw new Error(
      `Could not resolve join field for foreign relation '${relation.foreignRelationName}'`,
    );
  }

  return {
    prismaAccessor: lowercaseFirstChar(otherModel.name),
    foreignKeyFieldName,
    localFieldName,
  };
}

/**
 * Resolve relation info for relation filter expressions (exists/all) on a model.
 *
 * Searches both local relations (FK on this model) and foreign/reverse relations
 * (FK on other models pointing to this model via foreignRelationName).
 */
function resolveRelationFilters(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
  relationFilterRefs: { relationName: string }[],
): Map<string, ResolvedRelationFilter> {
  const resolvedFilters = new Map<string, ResolvedRelationFilter>();

  for (const { relationName } of relationFilterRefs) {
    if (resolvedFilters.has(relationName)) {
      continue;
    }

    // Try local relations first (FK on this model)
    const localRelation = model.model.relations.find(
      (r) => r.name === relationName,
    );

    if (localRelation) {
      // Local relation: localRef is on this model, foreignRef is on the foreign model
      resolvedFilters.set(
        relationName,
        resolveLocalRelationFilter(appBuilder, model, localRelation),
      );
      continue;
    }

    // Search foreign/reverse relations: other models that point TO this model
    let found = false;
    for (const otherModel of appBuilder.projectDefinition.models) {
      const foreignRel = otherModel.model.relations.find(
        (r) =>
          r.modelRef === model.id && r.foreignRelationName === relationName,
      );
      if (foreignRel) {
        // Foreign relation: the relation is defined on otherModel
        // localRef = FK field on otherModel, foreignRef = join field on current model
        resolvedFilters.set(
          relationName,
          resolveForeignRelationFilter(appBuilder, otherModel, foreignRel),
        );
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(
        `Relation '${relationName}' not found on model '${model.name}' (checked both local and foreign relations)`,
      );
    }
  }

  return resolvedFilters;
}

/**
 * Build model authorizer generators for all models in a feature
 * that have non-empty authorizer roles.
 */
export function buildAuthorizersForFeature(
  appBuilder: BackendAppEntryBuilder,
  featureId: string,
): GeneratorBundle[] {
  const models = ModelUtils.getModelsForFeature(
    appBuilder.projectDefinition,
    featureId,
  );

  return models
    .filter((model) => model.authorizer.roles.length > 0)
    .map((model) => {
      const { authorizer } = model;

      const primaryKeyFields = ModelUtils.getPrimaryKeyFields(model);
      if (primaryKeyFields.length !== 1) {
        throw new Error(
          `Model '${model.name}' must have exactly one primary key field to use model authorizer. Found ${primaryKeyFields.length}.`,
        );
      }
      const idFieldName = primaryKeyFields[0].name;

      // Collect all nested role refs and relation filter refs across all roles
      const allNestedRoleRefs: { relationName: string; roles: string[] }[] = [];
      const allRelationFilterRefs: { relationName: string }[] = [];
      const parsedRoles = authorizer.roles.map((role) => {
        const parsed = parseAuthorizerExpression(role.expression);
        allNestedRoleRefs.push(...parsed.nestedRoleRefs);
        allRelationFilterRefs.push(...parsed.relationFilterRefs);
        return { role, parsed };
      });

      // Resolve relation info if there are nested refs
      const { resolvedRelations, foreignModelNames } =
        allNestedRoleRefs.length > 0
          ? resolveNestedRelations(appBuilder, model, allNestedRoleRefs)
          : {
              resolvedRelations: new Map<string, ResolvedNestedRelation>(),
              foreignModelNames: [] as string[],
            };

      // Resolve relation filter info if there are relation filter refs
      const resolvedRelationFilters =
        allRelationFilterRefs.length > 0
          ? resolveRelationFilters(appBuilder, model, allRelationFilterRefs)
          : new Map<string, ResolvedRelationFilter>();

      const codeContext: AuthorizerExpressionCodeContext | undefined =
        resolvedRelations.size > 0 || resolvedRelationFilters.size > 0
          ? { resolvedRelations, resolvedRelationFilters }
          : undefined;

      return prismaModelAuthorizerGenerator({
        modelName: model.name,
        idFieldName,
        foreignAuthorizerModelNames: foreignModelNames,
        roles: parsedRoles.map(({ role, parsed }) => {
          const hasNestedRefs =
            parsed.nestedRoleRefs.length > 0 ||
            parsed.relationFilterRefs.length > 0;
          const expressionCode = generateAuthorizerExpressionCode(
            parsed.ast,
            codeContext,
          );

          let roleCode: string;
          if (hasNestedRefs) {
            // Nested refs and relation filters are async
            roleCode = parsed.requiresModel
              ? `async (ctx, model) => ${expressionCode}`
              : `async (ctx) => ${expressionCode}`;
          } else {
            roleCode = parsed.requiresModel
              ? `(ctx, model) => ${expressionCode}`
              : `(ctx) => ${expressionCode}`;
          }

          return {
            name: role.name,
            roleCode,
            foreignAuthorizerRefs: [
              ...new Set(
                parsed.nestedRoleRefs
                  .map(
                    (ref) =>
                      resolvedRelations.get(ref.relationName)?.foreignModelName,
                  )
                  .filter((n): n is string => n != null),
              ),
            ],
          };
        }),
      });
    });
}
