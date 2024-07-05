import { z } from 'zod';

import { baseAdminSectionValidators } from './base.js';
import {
  adminCrudEmbeddedFormEntityType,
  baseAdminCrudInputSchema,
} from './crud-form/types.js';
import { zRef, zRefBuilder } from '@src/references/index.js';
import {
  modelEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from '@src/schema/models/index.js';
import { notEmpty } from '@src/utils/array.js';

// Table Columns
export const adminCrudForeignDisplaySchema = z.object({
  type: z.literal('foreign'),
  localRelationName: zRef(z.string(), {
    type: modelLocalRelationEntityType,
    onDelete: 'RESTRICT',
    parentPath: { context: 'model' },
  }),
  labelExpression: z.string().min(1),
  valueExpression: z.string().min(1),
});

export type AdminCrudForeignDisplayConfig = z.infer<
  typeof adminCrudForeignDisplaySchema
>;

export const adminCrudTextDisplaySchema = z.object({
  type: z.literal('text'),
  modelField: zRef(z.string(), {
    type: modelScalarFieldEntityType,
    onDelete: 'RESTRICT',
    parentPath: { context: 'model' },
  }),
});

export type AdminCrudTextDisplayConfig = z.infer<
  typeof adminCrudTextDisplaySchema
>;

export const adminCrudDisplaySchema = z.discriminatedUnion('type', [
  adminCrudTextDisplaySchema,
  adminCrudForeignDisplaySchema,
]);

function primitiveMapToKeys<T extends Record<string, unknown>>(
  map: Map<T[keyof T], unknown>,
): (keyof T)[] {
  return Array.from(map.keys())
    .map((m) => m?.valueOf() as keyof T)
    .filter(notEmpty);
}

export const adminCrudDisplayTypes = primitiveMapToKeys(
  adminCrudDisplaySchema.optionsMap,
);

export type AdminCrudDisplayConfig = z.infer<typeof adminCrudDisplaySchema>;

export const adminCrudTableColumnSchema = z.object({
  label: z.string().min(1),
  display: adminCrudDisplaySchema,
});

// Embedded Crud
export const adminCrudEmbeddedObjectSchema = z.object({
  id: z.string().default(adminCrudEmbeddedFormEntityType.generateNewId()),
  name: z.string().min(1),
  modelName: zRef(z.string().min(1), {
    type: modelEntityType,
    onDelete: 'RESTRICT',
  }),
  includeIdField: z.boolean().optional(),
  type: z.literal('object'),
  form: z.object({
    fields: z.array(baseAdminCrudInputSchema),
  }),
});

export const adminCrudEmbeddedListSchema = z.object({
  id: z.string().default(adminCrudEmbeddedFormEntityType.generateNewId()),
  name: z.string().min(1),
  modelName: zRef(z.string().min(1), {
    type: modelEntityType,
    onDelete: 'RESTRICT',
  }),
  includeIdField: z.boolean().optional(),
  type: z.literal('list'),
  // NOTE: These two fields need to be synced with crud section schema
  // because the web app expects that (TODO)
  table: z.object({
    columns: z.array(adminCrudTableColumnSchema),
  }),
  form: z.object({
    fields: z.array(baseAdminCrudInputSchema),
  }),
});

export const adminCrudEmbeddedFormSchema = zRefBuilder(
  z.discriminatedUnion('type', [
    adminCrudEmbeddedObjectSchema,
    adminCrudEmbeddedListSchema,
  ]),
  (builder) => {
    builder.addEntity({
      type: adminCrudEmbeddedFormEntityType,
      parentPath: { context: 'admin-section' },
    });
    builder.addPathToContext('modelName', modelEntityType, 'model');
  },
);

export type AdminCrudEmbeddedFormConfig = z.infer<
  typeof adminCrudEmbeddedFormSchema
>;

// Admin Section

export const adminCrudSectionSchema = zRefBuilder(
  z.object({
    ...baseAdminSectionValidators,
    type: z.literal('crud'),
    modelName: zRef(z.string().min(1), {
      type: modelEntityType,
      onDelete: 'RESTRICT',
    }),
    disableCreate: z.boolean().optional(),
    table: z.object({
      columns: z.array(adminCrudTableColumnSchema),
    }),
    form: z.object({
      fields: z.array(baseAdminCrudInputSchema),
    }),
    embeddedForms: z.array(adminCrudEmbeddedFormSchema).optional(),
  }),
  (builder) => {
    builder.addPathToContext('modelName', modelEntityType, 'model');
  },
);

export type AdminCrudSectionConfig = z.infer<typeof adminCrudSectionSchema>;
