import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { authRoleEntityType } from '../auth/index.js';
import {
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from './types.js';

const createRoleArray = definitionSchema((ctx) =>
  z
    .array(
      ctx.withRef(z.string(), {
        type: authRoleEntityType,
        onDelete: 'DELETE',
      }),
    )
    .optional(),
);

export const createModelGraphqlSchema = definitionSchema((ctx) =>
  z.object({
    objectType: z
      .object({
        enabled: z.boolean().default(false),
        fields: z.array(
          ctx.withRef(z.string(), {
            type: modelScalarFieldEntityType,
            onDelete: 'DELETE',
            parentPath: { context: 'model' },
          }),
        ),
        localRelations: z
          .array(
            ctx.withRef(z.string(), {
              type: modelLocalRelationEntityType,
              onDelete: 'DELETE',
              parentPath: { context: 'model' },
            }),
          )
          .optional(),
        foreignRelations: z
          .array(
            ctx.withRef(z.string(), {
              type: modelForeignRelationEntityType,
              onDelete: 'DELETE',
              parentPath: { context: 'model' },
            }),
          )
          .optional(),
      })
      .default({
        enabled: false,
        fields: [],
      }),
    queries: z
      .object({
        get: z
          .object({
            enabled: z.boolean().optional(),
            roles: createRoleArray(ctx),
          })
          .optional(),
        list: z
          .object({
            enabled: z.boolean().optional(),
            roles: createRoleArray(ctx),
          })
          .optional(),
      })
      .default({
        get: {
          enabled: false,
          roles: [],
        },
        list: {
          enabled: false,
          roles: [],
        },
      }),
    mutations: z
      .object({
        create: z
          .object({
            enabled: z.boolean().optional(),
            roles: createRoleArray(ctx),
          })
          .default({
            enabled: false,
            roles: [],
          }),
        update: z
          .object({
            enabled: z.boolean().optional(),
            roles: createRoleArray(ctx),
          })
          .default({
            enabled: false,
            roles: [],
          }),
        delete: z
          .object({
            enabled: z.boolean().optional(),
            roles: createRoleArray(ctx),
          })
          .default({
            enabled: false,
            roles: [],
          }),
      })
      .default({}),
  }),
);

export type ModelGraphqlInput = def.InferInput<typeof createModelGraphqlSchema>;

export type ModelGraphqlDefinition = def.InferOutput<
  typeof createModelGraphqlSchema
>;
