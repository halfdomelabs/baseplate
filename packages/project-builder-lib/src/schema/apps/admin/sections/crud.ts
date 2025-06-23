import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { zRef, zRefBuilder } from '#src/references/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';
import {
  modelEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from '#src/schema/models/index.js';

import { baseAdminSectionValidators } from './base.js';
import { createAdminCrudInputSchema } from './crud-form/admin-crud-input.js';
import { adminCrudEmbeddedFormEntityType } from './crud-form/types.js';

// Table Columns
export const createAdminCrudForeignDisplaySchema = definitionSchema(() =>
  z.object({
    type: z.literal('foreign'),
    localRelationRef: zRef(z.string(), {
      type: modelLocalRelationEntityType,
      onDelete: 'RESTRICT',
      parentPath: { context: 'model' },
    }),
    labelExpression: z.string().min(1),
    valueExpression: z.string().min(1),
  }),
);

export type AdminCrudForeignDisplayConfig = def.InferOutput<
  typeof createAdminCrudForeignDisplaySchema
>;

export const createAdminCrudTextDisplaySchema = definitionSchema(() =>
  z.object({
    type: z.literal('text'),
    modelFieldRef: zRef(z.string(), {
      type: modelScalarFieldEntityType,
      onDelete: 'RESTRICT',
      parentPath: { context: 'model' },
    }),
  }),
);

export type AdminCrudTextDisplayConfig = def.InferOutput<
  typeof createAdminCrudTextDisplaySchema
>;

export const createAdminCrudDisplaySchema = definitionSchema((ctx) =>
  z.discriminatedUnion('type', [
    createAdminCrudTextDisplaySchema(ctx),
    createAdminCrudForeignDisplaySchema(ctx),
  ]),
);

// TODO: Improve this to be more dynamic in the future
export const adminCrudDisplayTypes = ['text', 'foreign'] as const;

export type AdminCrudDisplayConfig = def.InferOutput<
  typeof createAdminCrudDisplaySchema
>;

export const createAdminCrudTableColumnSchema = definitionSchema((ctx) =>
  z.object({
    label: z.string().min(1),
    display: createAdminCrudDisplaySchema(ctx),
  }),
);

// Embedded Crud
export const createAdminCrudEmbeddedObjectSchema = definitionSchema((ctx) =>
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    modelRef: zRef(z.string().min(1), {
      type: modelEntityType,
      onDelete: 'RESTRICT',
    }),
    includeIdField: z.boolean().optional(),
    type: z.literal('object'),
    form: z.object({
      fields: z.array(createAdminCrudInputSchema(ctx)),
    }),
  }),
);

export const createAdminCrudEmbeddedListSchema = definitionSchema((ctx) =>
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    modelRef: zRef(z.string().min(1), {
      type: modelEntityType,
      onDelete: 'RESTRICT',
    }),
    includeIdField: z.boolean().optional(),
    type: z.literal('list'),
    // NOTE: These two fields need to be synced with crud section schema
    // because the web app expects that (TODO)
    table: z.object({
      columns: z.array(createAdminCrudTableColumnSchema(ctx)),
    }),
    form: z.object({
      fields: z.array(createAdminCrudInputSchema(ctx)),
    }),
  }),
);

export const createAdminCrudEmbeddedFormSchema = definitionSchema((ctx) =>
  zRefBuilder(
    z.discriminatedUnion('type', [
      createAdminCrudEmbeddedObjectSchema(ctx),
      createAdminCrudEmbeddedListSchema(ctx),
    ]),
    (builder) => {
      builder.addEntity({
        type: adminCrudEmbeddedFormEntityType,
        parentPath: { context: 'admin-section' },
      });
      builder.addPathToContext('modelRef', modelEntityType, 'model');
    },
  ),
);

export type AdminCrudEmbeddedFormConfig = def.InferOutput<
  typeof createAdminCrudEmbeddedFormSchema
>;

export type AdminCrudEmbeddedFormConfigInput = def.InferInput<
  typeof createAdminCrudEmbeddedFormSchema
>;

// Admin Section

export const createAdminCrudSectionSchema = definitionSchema((ctx) =>
  zRefBuilder(
    z.object({
      ...baseAdminSectionValidators,
      type: z.literal('crud'),
      modelRef: zRef(z.string().min(1), {
        type: modelEntityType,
        onDelete: 'RESTRICT',
      }),
      disableCreate: z.boolean().optional(),
      table: z.object({
        columns: z.array(createAdminCrudTableColumnSchema(ctx)),
      }),
      form: z.object({
        fields: z.array(createAdminCrudInputSchema(ctx)),
      }),
      embeddedForms: z.array(createAdminCrudEmbeddedFormSchema(ctx)).optional(),
    }),
    (builder) => {
      builder.addPathToContext('modelRef', modelEntityType, 'model');
    },
  ),
);

export type AdminCrudSectionConfig = def.InferOutput<
  typeof createAdminCrudSectionSchema
>;

export type AdminCrudSectionConfigInput = def.InferInput<
  typeof createAdminCrudSectionSchema
>;
