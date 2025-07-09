import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { authRoleEntityType } from '../auth/index.js';
import { createDefaultHandler } from '../utils/create-default-handler.js';
import {
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from './types.js';

const createRoleArray = definitionSchema((ctx) =>
  z
    .array(
      ctx.withRef({
        type: authRoleEntityType,
        onDelete: 'DELETE',
      }),
    )
    .optional()
    .transform(createDefaultHandler(ctx, [])),
);

export const createModelGraphqlSchema = definitionSchema((ctx) =>
  z.object({
    objectType: z
      .object({
        enabled: z
          .boolean()
          .optional()
          .transform(createDefaultHandler(ctx, false)),
        fields: z
          .array(
            ctx.withRef({
              type: modelScalarFieldEntityType,
              onDelete: 'DELETE',
              parentPath: { context: 'model' },
            }),
          )
          .optional()
          .transform(createDefaultHandler(ctx, [])),
        localRelations: z
          .array(
            ctx.withRef({
              type: modelLocalRelationEntityType,
              onDelete: 'DELETE',
              parentPath: { context: 'model' },
            }),
          )
          .optional()
          .transform(createDefaultHandler(ctx, [])),
        foreignRelations: z
          .array(
            ctx.withRef({
              type: modelForeignRelationEntityType,
              onDelete: 'DELETE',
              parentPath: { context: 'model' },
            }),
          )
          .optional()
          .transform(createDefaultHandler(ctx, [])),
      })
      .transform(createDefaultHandler(ctx, {})),
    queries: z
      .object({
        get: z
          .object({
            enabled: z
              .boolean()
              .optional()
              .transform(createDefaultHandler(ctx, false)),
            roles: createRoleArray(ctx),
          })
          .optional()
          .transform(createDefaultHandler(ctx, {})),
        list: z
          .object({
            enabled: z
              .boolean()
              .optional()
              .transform(createDefaultHandler(ctx, false)),
            roles: createRoleArray(ctx),
          })
          .optional()
          .transform(createDefaultHandler(ctx, {})),
      })
      .optional()
      .transform(createDefaultHandler(ctx, {})),
    mutations: z
      .object({
        create: z
          .object({
            enabled: z
              .boolean()
              .optional()
              .transform(createDefaultHandler(ctx, false)),
            roles: createRoleArray(ctx),
          })
          .optional()
          .transform(createDefaultHandler(ctx, {})),
        update: z
          .object({
            enabled: z
              .boolean()
              .optional()
              .transform(createDefaultHandler(ctx, false)),
            roles: createRoleArray(ctx),
          })
          .optional()
          .transform(createDefaultHandler(ctx, {})),
        delete: z
          .object({
            enabled: z
              .boolean()
              .optional()
              .transform(createDefaultHandler(ctx, false)),
            roles: createRoleArray(ctx),
          })
          .optional()
          .transform(createDefaultHandler(ctx, {})),
      })
      .optional()
      .transform(createDefaultHandler(ctx, {})),
  }),
);

export type ModelGraphqlInput = def.InferInput<typeof createModelGraphqlSchema>;

export type ModelGraphqlDefinition = def.InferOutput<
  typeof createModelGraphqlSchema
>;
