import type {
  AuthorizerExpressionNode,
  FieldRefNode,
} from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import { prismaModelAuthorizerGenerator } from '@baseplate-dev/fastify-generators';
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
    .filter((model) => model.authorizer && model.authorizer.roles.length > 0)
    .map((model) => {
      const { authorizer } = model;
      if (!authorizer) {
        throw new Error(`Model '${model.name}' has no authorizer config`);
      }

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
