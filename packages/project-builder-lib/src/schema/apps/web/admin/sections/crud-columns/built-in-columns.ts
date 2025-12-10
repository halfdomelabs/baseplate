import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { definitionSchemaWithSlots } from '#src/schema/creator/schema-creator.js';
import {
  modelEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from '#src/schema/models/index.js';

import type { AdminCrudColumnType } from './types.js';

import {
  baseAdminCrudColumnSchema,
  createAdminCrudColumnType,
} from './types.js';

// Text Column
export const createAdminCrudTextColumnSchema = definitionSchemaWithSlots(
  { modelSlot: modelEntityType },
  (ctx, { modelSlot }) =>
    baseAdminCrudColumnSchema.extend({
      type: z.literal('text'),
      modelFieldRef: ctx.withRef({
        type: modelScalarFieldEntityType,
        onDelete: 'RESTRICT',
        parentRef: modelSlot,
      }),
    }),
);

export type AdminCrudTextColumnInput = def.InferInput<
  typeof createAdminCrudTextColumnSchema
>;

export type AdminCrudTextColumnDefinition = def.InferOutput<
  typeof createAdminCrudTextColumnSchema
>;

const adminCrudTextColumnType = createAdminCrudColumnType({
  name: 'text',
  createSchema: createAdminCrudTextColumnSchema,
});

// Foreign Column
export const createAdminCrudForeignColumnSchema = definitionSchemaWithSlots(
  { modelSlot: modelEntityType },
  (ctx, { modelSlot }) =>
    baseAdminCrudColumnSchema.extend({
      type: z.literal('foreign'),
      localRelationRef: ctx.withRef({
        type: modelLocalRelationEntityType,
        onDelete: 'RESTRICT',
        parentRef: modelSlot,
      }),
      labelExpression: z.string().min(1),
      valueExpression: z.string().min(1),
    }),
);

export type AdminCrudForeignColumnInput = def.InferInput<
  typeof createAdminCrudForeignColumnSchema
>;

export type AdminCrudForeignColumnDefinition = def.InferOutput<
  typeof createAdminCrudForeignColumnSchema
>;

const adminCrudForeignColumnType = createAdminCrudColumnType({
  name: 'foreign',
  createSchema: createAdminCrudForeignColumnSchema,
});

export const BUILT_IN_ADMIN_CRUD_COLUMNS: AdminCrudColumnType[] = [
  adminCrudTextColumnType,
  adminCrudForeignColumnType,
];
