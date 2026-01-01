import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { definitionSchemaWithSlots } from '#src/schema/creator/schema-creator.js';
import { VALIDATORS } from '#src/schema/utils/validation.js';

import { modelEntityType } from '../types.js';
import { authorizerExpressionParser } from './authorizer-expression-parser.js';
import { modelAuthorizerRoleEntityType } from './types.js';

/**
 * Schema for a single authorizer role.
 *
 * A role defines a named authorization check that can be referenced
 * by operations (GraphQL queries/mutations, service methods).
 */
export const createAuthorizerRoleSchema = definitionSchemaWithSlots(
  { modelSlot: modelEntityType },
  (ctx, { modelSlot }) =>
    ctx.withEnt(
      z.object({
        /** Unique identifier for this role */
        id: z.string(),
        /**
         * Name of the role (camelCase).
         * Used as the key in the generated roles object.
         * @example 'owner', 'viewer', 'organizationMember'
         */
        name: VALIDATORS.CAMEL_CASE_STRING,
        /**
         * TypeScript expression that evaluates to a boolean.
         *
         * Available context variables:
         * - `model` - The model instance being authorized
         * - `auth` - The AuthContext with userId, roles, etc.
         *
         * @example 'model.id === auth.userId'
         * @example 'auth.hasRole("admin")'
         * @example 'model.organizationId === auth.organizationId'
         */
        expression: ctx.withExpression(authorizerExpressionParser, {
          model: modelSlot,
        }),
      }),
      {
        type: modelAuthorizerRoleEntityType,
        parentSlot: modelSlot,
      },
    ),
);

export type AuthorizerRoleConfig = def.InferOutput<
  typeof createAuthorizerRoleSchema
>;

export type AuthorizerRoleConfigInput = def.InferInput<
  typeof createAuthorizerRoleSchema
>;

/**
 * Schema for model authorizer configuration.
 *
 * The authorizer defines instance-level authorization checks
 * that operations can reference.
 */
export const createModelAuthorizerSchema = definitionSchemaWithSlots(
  { modelSlot: modelEntityType },
  (ctx, { modelSlot }) =>
    z.object({
      /**
       * Array of role definitions for this model.
       * Each role is a named authorization check.
       */
      roles: z
        .array(createAuthorizerRoleSchema(ctx, { modelSlot }))
        .default([]),
    }),
);

export type ModelAuthorizerConfig = def.InferOutput<
  typeof createModelAuthorizerSchema
>;

export type ModelAuthorizerConfigInput = def.InferInput<
  typeof createModelAuthorizerSchema
>;
