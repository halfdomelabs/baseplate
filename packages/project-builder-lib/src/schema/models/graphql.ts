import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import {
  definitionSchema,
  definitionSchemaWithSlots,
} from '#src/schema/creator/schema-creator.js';

import { authRoleEntityType } from '../auth/index.js';
import {
  modelEntityType,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from './types.js';

const createRoleArray = definitionSchema((ctx) =>
  ctx.withDefault(
    z.array(
      ctx.withRef({
        type: authRoleEntityType,
        onDelete: 'DELETE',
      }),
    ),
    [],
  ),
);

export const createModelGraphqlSchema = definitionSchemaWithSlots(
  {
    modelSlot: modelEntityType,
  },
  (ctx, { modelSlot }) =>
    z.object({
      objectType: ctx.withDefault(
        z.object({
          enabled: ctx.withDefault(z.boolean(), false),
          fields: ctx.withDefault(
            z.array(
              ctx.withRef({
                type: modelScalarFieldEntityType,
                onDelete: 'DELETE',
                parentRef: modelSlot,
              }),
            ),
            [],
          ),
          localRelations: ctx.withDefault(
            z.array(
              ctx.withRef({
                type: modelLocalRelationEntityType,
                onDelete: 'DELETE',
                parentRef: modelSlot,
              }),
            ),
            [],
          ),
          foreignRelations: ctx.withDefault(
            z.array(
              ctx.withRef({
                type: modelForeignRelationEntityType,
                onDelete: 'DELETE',
                parentRef: modelSlot,
              }),
            ),
            [],
          ),
        }),
        {},
      ),
      queries: ctx.withDefault(
        z.object({
          get: ctx.withDefault(
            z.object({
              enabled: ctx.withDefault(z.boolean(), false),
              roles: createRoleArray(ctx),
            }),
            {},
          ),
          list: ctx.withDefault(
            z.object({
              enabled: ctx.withDefault(z.boolean(), false),
              roles: createRoleArray(ctx),
            }),
            {},
          ),
        }),
        {},
      ),
      mutations: ctx.withDefault(
        z.object({
          create: ctx.withDefault(
            z.object({
              enabled: ctx.withDefault(z.boolean(), false),
              roles: createRoleArray(ctx),
            }),
            {},
          ),
          update: ctx.withDefault(
            z.object({
              enabled: ctx.withDefault(z.boolean(), false),
              roles: createRoleArray(ctx),
            }),
            {},
          ),
          delete: ctx.withDefault(
            z.object({
              enabled: ctx.withDefault(z.boolean(), false),
              roles: createRoleArray(ctx),
            }),
            {},
          ),
        }),
        {},
      ),
    }),
);

export type ModelGraphqlInput = def.InferInput<typeof createModelGraphqlSchema>;

export type ModelGraphqlDefinition = def.InferOutput<
  typeof createModelGraphqlSchema
>;
