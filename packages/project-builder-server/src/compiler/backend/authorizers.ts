import type {
  AuthorizerExpressionNode,
  FieldRefNode,
} from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import {
  prismaModelAuthorizerGenerator,
  prismaModelQueryFilterGenerator,
} from '@baseplate-dev/fastify-generators';
import {
  ModelUtils,
  parseAuthorizerExpression,
} from '@baseplate-dev/project-builder-lib';

import type { BackendAppEntryBuilder } from '../app-entry-builder.js';

/**
 * Generate TypeScript code from an authorizer expression AST node.
 *
 * Transforms the implicit-context DSL into explicit context code:
 * - `model.field` stays as `model.field`
 * - `userId` (auth field) becomes `ctx.auth.userId`
 * - `hasRole('admin')` becomes `ctx.auth.hasRole('admin')`
 * - `hasSomeRole(['a', 'b'])` becomes `ctx.auth.hasSomeRole(['a', 'b'])`
 * - `A || B` becomes `(A) || (B)`
 */
export function generateAuthorizerExpressionCode(
  node: AuthorizerExpressionNode,
): string {
  switch (node.type) {
    case 'fieldComparison': {
      const left = generateFieldRefCode(node.left);
      const right = generateFieldRefCode(node.right);
      return `${left} ${node.operator} ${right}`;
    }
    case 'hasRole': {
      return `ctx.auth.hasRole('${node.role}')`;
    }
    case 'hasSomeRole': {
      const roles = node.roles.map((r: string) => `'${r}'`).join(', ');
      return `ctx.auth.hasSomeRole([${roles}])`;
    }
    case 'binaryLogical': {
      const left = generateAuthorizerExpressionCode(node.left);
      const right = generateAuthorizerExpressionCode(node.right);
      return `(${left}) ${node.operator} (${right})`;
    }
  }
}

function generateFieldRefCode(node: FieldRefNode): string {
  if (node.source === 'model') {
    return `model.${node.field}`;
  }
  return `ctx.auth.${node.field}`;
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

      return prismaModelAuthorizerGenerator({
        modelName: model.name,
        idFieldName,
        roles: authorizer.roles.map((role) => {
          const parsed = parseAuthorizerExpression(role.expression);
          const expressionCode = generateAuthorizerExpressionCode(parsed.ast);

          const roleCode = parsed.requiresModel
            ? `(ctx, model) => ${expressionCode}`
            : `(ctx) => ${expressionCode}`;

          return {
            name: role.name,
            roleCode,
          };
        }),
      });
    });
}

// ── Query filter expression compiler ────────────────────────────────

/**
 * Generate TypeScript code from an authorizer expression AST node,
 * producing a Prisma where clause instead of a boolean check.
 *
 * - `model.field === userId` → `{ field: ctx.auth.userId }`
 * - `hasRole('admin')` → `ctx.auth.hasRole('admin')` (boolean → true/false)
 * - `hasSomeRole([...])` → `ctx.auth.hasSomeRole([...])` (boolean)
 * - `A || B` → `queryHelpers.or([A, B])`
 * - `A && B` → `queryHelpers.and([A, B])`
 */
function generateQueryFilterExpressionCode(
  node: AuthorizerExpressionNode,
): string {
  switch (node.type) {
    case 'fieldComparison': {
      return generateFieldComparisonWhereCode(node.left, node.right);
    }
    case 'hasRole': {
      return `ctx.auth.hasRole('${node.role}')`;
    }
    case 'hasSomeRole': {
      const roles = node.roles.map((r: string) => `'${r}'`).join(', ');
      return `ctx.auth.hasSomeRole([${roles}])`;
    }
    case 'binaryLogical': {
      const left = generateQueryFilterExpressionCode(node.left);
      const right = generateQueryFilterExpressionCode(node.right);
      const helper = node.operator === '||' ? 'or' : 'and';
      return `queryHelpers.${helper}([${left}, ${right}])`;
    }
  }
}

/**
 * Generate a Prisma where clause from a field comparison.
 *
 * In a field comparison one side is always a model field and the other
 * is an auth field. We produce `{ modelField: ctx.auth.authField }`.
 */
function generateFieldComparisonWhereCode(
  left: FieldRefNode,
  right: FieldRefNode,
): string {
  const modelNode = left.source === 'model' ? left : right;
  const authNode = left.source === 'auth' ? left : right;
  return `{ ${modelNode.field}: ctx.auth.${authNode.field} }`;
}

/**
 * Build model query filter generators for all models in a feature
 * that have non-empty query instance roles.
 */
export function buildQueryFiltersForFeature(
  appBuilder: BackendAppEntryBuilder,
  featureId: string,
): GeneratorBundle[] {
  const models = ModelUtils.getModelsForFeature(
    appBuilder.projectDefinition,
    featureId,
  );

  return models
    .filter((model) => model.graphql.queries.instanceRoles.length > 0)
    .map((model) => {
      const { authorizer, graphql } = model;
      const instanceRoleRefs = graphql.queries.instanceRoles;

      // Resolve authorizer roles referenced by instance role refs
      const roles = instanceRoleRefs.map((roleRef) => {
        const authRole = authorizer.roles.find(
          (r) => r.id === roleRef || r.name === roleRef,
        );
        if (!authRole) {
          throw new Error(
            `Instance role '${roleRef}' not found in model '${model.name}' authorizer roles.`,
          );
        }

        const parsed = parseAuthorizerExpression(authRole.expression);
        const expressionCode = generateQueryFilterExpressionCode(parsed.ast);

        // Wrap object literals in parens to avoid arrow function body ambiguity
        const wrappedCode = expressionCode.startsWith('{')
          ? `(${expressionCode})`
          : expressionCode;

        return {
          name: authRole.name,
          roleCode: `(ctx) => ${wrappedCode}`,
        };
      });

      return prismaModelQueryFilterGenerator({
        modelName: model.name,
        roles,
      });
    });
}
