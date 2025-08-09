import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { definitionSchema } from '#src/schema/creator/schema-creator.js';
import {
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from '#src/schema/models/index.js';

import type { AdminCrudInputType } from './types.js';

import {
  adminCrudEmbeddedFormEntityType,
  createAdminCrudInputType,
} from './types.js';

export const createAdminCrudTextInputSchema = definitionSchema((ctx) =>
  z.object({
    id: z.string(),
    type: z.literal('text'),
    label: z.string().min(1),
    modelFieldRef: ctx.withRef({
      type: modelScalarFieldEntityType,
      onDelete: 'RESTRICT',
      parentPath: { context: 'model' },
    }),
    validation: z.string().optional(),
  }),
);

export type AdminCrudTextInputConfig = def.InferOutput<
  typeof createAdminCrudTextInputSchema
>;

const adminCrudTextInputType = createAdminCrudInputType({
  name: 'text',
  createSchema: createAdminCrudTextInputSchema,
});

export const createAdminCrudForeignInputSchema = definitionSchema((ctx) =>
  z.object({
    id: z.string(),
    type: z.literal('foreign'),
    label: z.string().min(1),
    localRelationRef: ctx.withRef({
      type: modelLocalRelationEntityType,
      onDelete: 'RESTRICT',
      parentPath: { context: 'model' },
    }),
    labelExpression: z.string().min(1),
    valueExpression: z.string().min(1),
    defaultLabel: z.string().optional(),
    nullLabel: z.string().optional(),
  }),
);

export type AdminCrudForeignInputConfig = def.InferOutput<
  typeof createAdminCrudForeignInputSchema
>;

const adminCrudForeignInputType = createAdminCrudInputType({
  name: 'foreign',
  createSchema: createAdminCrudForeignInputSchema,
});

export const createAdminCrudEnumInputSchema = definitionSchema((ctx) =>
  z.object({
    id: z.string(),
    type: z.literal('enum'),
    label: z.string().min(1),
    modelFieldRef: ctx.withRef({
      type: modelScalarFieldEntityType,
      onDelete: 'RESTRICT',
      parentPath: { context: 'model' },
    }),
  }),
);

export type AdminCrudEnumInputConfig = def.InferOutput<
  typeof createAdminCrudEnumInputSchema
>;

const adminCrudEnumInputType = createAdminCrudInputType({
  name: 'enum',
  createSchema: createAdminCrudEnumInputSchema,
});

export const createAdminCrudEmbeddedInputSchema = definitionSchema((ctx) =>
  z.object({
    id: z.string(),
    type: z.literal('embedded'),
    label: z.string().min(1),
    modelRelationRef: ctx.withRef({
      type: modelForeignRelationEntityType,
      onDelete: 'RESTRICT',
      parentPath: { context: 'model' },
    }),
    embeddedFormRef: ctx.withRef({
      type: adminCrudEmbeddedFormEntityType,
      parentPath: { context: 'admin-section' },
      onDelete: 'RESTRICT',
    }),
  }),
);

export type AdminCrudEmbeddedInputConfig = def.InferOutput<
  typeof createAdminCrudEmbeddedInputSchema
>;

export const adminCrudEmbeddedInputType = createAdminCrudInputType({
  name: 'embedded',
  createSchema: createAdminCrudEmbeddedInputSchema,
});

export const createAdminCrudEmbeddedLocalInputSchema = definitionSchema((ctx) =>
  z.object({
    id: z.string(),
    type: z.literal('embeddedLocal'),
    label: z.string().min(1),
    localRelationRef: ctx.withRef({
      type: modelLocalRelationEntityType,
      onDelete: 'RESTRICT',
      parentPath: { context: 'model' },
    }),
    embeddedFormRef: ctx.withRef({
      type: adminCrudEmbeddedFormEntityType,
      parentPath: { context: 'admin-section' },
      onDelete: 'RESTRICT',
    }),
  }),
);

export type AdminCrudEmbeddedLocalInputConfig = def.InferOutput<
  typeof createAdminCrudEmbeddedLocalInputSchema
>;

export const adminCrudEmbeddedLocalInputType = createAdminCrudInputType({
  name: 'embeddedLocal',
  createSchema: createAdminCrudEmbeddedLocalInputSchema,
});

export const createAdminCrudPasswordInputSchema = definitionSchema(() =>
  z.object({
    id: z.string(),
    type: z.literal('password'),
    label: z.string().min(1),
  }),
);

export type AdminCrudPasswordInputConfig = def.InferOutput<
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
