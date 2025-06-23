import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { zRef } from '#src/references/ref-builder.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { authRoleEntityType } from '../auth/index.js';
import {
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from './types.js';

const roleArray = z
  .array(
    zRef(z.string(), {
      type: authRoleEntityType,
      onDelete: 'DELETE',
    }),
  )
  .optional();

export const createModelGraphqlSchema = definitionSchema(() =>
  z.object({
    objectType: z
      .object({
        enabled: z.boolean().default(false),
        fields: z.array(
          zRef(z.string(), {
            type: modelScalarFieldEntityType,
            onDelete: 'DELETE',
            parentPath: { context: 'model' },
          }),
        ),
        localRelations: z
          .array(
            zRef(z.string(), {
              type: modelLocalRelationEntityType,
              onDelete: 'DELETE',
              parentPath: { context: 'model' },
            }),
          )
          .optional(),
        foreignRelations: z
          .array(
            zRef(z.string(), {
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
            roles: roleArray,
          })
          .optional(),
        list: z
          .object({
            enabled: z.boolean().optional(),
            roles: roleArray,
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
            roles: roleArray,
          })
          .default({
            enabled: false,
            roles: [],
          }),
        update: z
          .object({
            enabled: z.boolean().optional(),
            roles: roleArray,
          })
          .default({
            enabled: false,
            roles: [],
          }),
        delete: z
          .object({
            enabled: z.boolean().optional(),
            roles: roleArray,
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
