import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import {
  definitionSchema,
  definitionSchemaWithSlots,
} from '#src/schema/creator/schema-creator.js';
import {
  modelEntityType,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from '#src/schema/models/index.js';

import type { AdminCrudInputType } from './types.js';

import { adminSectionEntityType } from '../types.js';
import {
  adminCrudEmbeddedFormEntityType,
  baseAdminCrudInputSchema,
  createAdminCrudInputType,
} from './types.js';

export const createAdminCrudTextInputSchema = definitionSchemaWithSlots(
  { modelSlot: modelEntityType, adminSectionSlot: adminSectionEntityType },
  (ctx, { modelSlot }) =>
    baseAdminCrudInputSchema.extend({
      type: z.literal('text'),
      label: z.string().min(1),
      modelFieldRef: ctx.withRef({
        type: modelScalarFieldEntityType,
        onDelete: 'RESTRICT',
        parentRef: modelSlot,
      }),
      validation: z.string().optional(),
    }),
);

export type AdminCrudTextInputConfig = def.InferInput<
  typeof createAdminCrudTextInputSchema
>;

const adminCrudTextInputType = createAdminCrudInputType({
  name: 'text',
  createSchema: createAdminCrudTextInputSchema,
});

export const createAdminCrudForeignInputSchema = definitionSchemaWithSlots(
  { modelSlot: modelEntityType, adminSectionSlot: adminSectionEntityType },
  (ctx, { modelSlot }) =>
    baseAdminCrudInputSchema.extend({
      type: z.literal('foreign'),
      label: z.string().min(1),
      localRelationRef: ctx.withRef({
        type: modelLocalRelationEntityType,
        onDelete: 'RESTRICT',
        parentRef: modelSlot,
      }),
      labelExpression: z.string().min(1),
      valueExpression: z.string().min(1),
      defaultLabel: z.string().optional(),
      nullLabel: z.string().optional(),
    }),
);

export type AdminCrudForeignInputConfig = def.InferInput<
  typeof createAdminCrudForeignInputSchema
>;

const adminCrudForeignInputType = createAdminCrudInputType({
  name: 'foreign',
  createSchema: createAdminCrudForeignInputSchema,
});

export const createAdminCrudEnumInputSchema = definitionSchemaWithSlots(
  { modelSlot: modelEntityType, adminSectionSlot: adminSectionEntityType },
  (ctx, { modelSlot }) =>
    baseAdminCrudInputSchema.extend({
      type: z.literal('enum'),
      label: z.string().min(1),
      modelFieldRef: ctx.withRef({
        type: modelScalarFieldEntityType,
        onDelete: 'RESTRICT',
        parentRef: modelSlot,
      }),
    }),
);

export type AdminCrudEnumInputConfig = def.InferInput<
  typeof createAdminCrudEnumInputSchema
>;

const adminCrudEnumInputType = createAdminCrudInputType({
  name: 'enum',
  createSchema: createAdminCrudEnumInputSchema,
});

export const createAdminCrudEmbeddedInputSchema = definitionSchemaWithSlots(
  { modelSlot: modelEntityType, adminSectionSlot: adminSectionEntityType },
  (ctx, { modelSlot, adminSectionSlot }) =>
    baseAdminCrudInputSchema.extend({
      type: z.literal('embedded'),
      label: z.string().min(1),
      modelRelationRef: ctx.withRef({
        type: modelForeignRelationEntityType,
        onDelete: 'RESTRICT',
        parentRef: modelSlot,
      }),
      embeddedFormRef: ctx.withRef({
        type: adminCrudEmbeddedFormEntityType,
        parentRef: adminSectionSlot,
        onDelete: 'RESTRICT',
      }),
    }),
);

export type AdminCrudEmbeddedInputConfig = def.InferInput<
  typeof createAdminCrudEmbeddedInputSchema
>;

export const adminCrudEmbeddedInputType = createAdminCrudInputType({
  name: 'embedded',
  createSchema: createAdminCrudEmbeddedInputSchema,
});

export const createAdminCrudEmbeddedLocalInputSchema =
  definitionSchemaWithSlots(
    { modelSlot: modelEntityType, adminSectionSlot: adminSectionEntityType },
    (ctx, { modelSlot, adminSectionSlot }) =>
      baseAdminCrudInputSchema.extend({
        type: z.literal('embeddedLocal'),
        label: z.string().min(1),
        localRelationRef: ctx.withRef({
          type: modelLocalRelationEntityType,
          onDelete: 'RESTRICT',
          parentRef: modelSlot,
        }),
        embeddedFormRef: ctx.withRef({
          type: adminCrudEmbeddedFormEntityType,
          parentRef: adminSectionSlot,
          onDelete: 'RESTRICT',
        }),
      }),
  );

export type AdminCrudEmbeddedLocalInputConfig = def.InferInput<
  typeof createAdminCrudEmbeddedLocalInputSchema
>;

export const adminCrudEmbeddedLocalInputType = createAdminCrudInputType({
  name: 'embeddedLocal',
  createSchema: createAdminCrudEmbeddedLocalInputSchema,
});

export const createAdminCrudPasswordInputSchema = definitionSchema(() =>
  baseAdminCrudInputSchema.extend({
    type: z.literal('password'),
    label: z.string().min(1),
  }),
);

export type AdminCrudPasswordInputConfig = def.InferInput<
  typeof createAdminCrudPasswordInputSchema
>;

const adminCrudPasswordInputType = createAdminCrudInputType({
  name: 'password',
  createSchema: createAdminCrudPasswordInputSchema,
});

export const BUILT_IN_ADMIN_CRUD_INPUTS: AdminCrudInputType[] = [
  adminCrudTextInputType,
  adminCrudForeignInputType,
  adminCrudEnumInputType,
  adminCrudEmbeddedInputType,
  adminCrudEmbeddedLocalInputType,
  adminCrudPasswordInputType,
];
