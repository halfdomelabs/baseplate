import { z } from 'zod';

import { baseAdminSectionValidators } from './base.js';
import { adminSectionEntityType } from './types.js';
import { createEntityType, zRef, zRefBuilder } from '@src/references/index.js';
import {
  modelEntityType,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldType,
  modelTransformerEntityType,
} from '@src/schema/models/index.js';
import { notEmpty } from '@src/utils/array.js';

export const adminCrudEmbeddedFormEntityType = createEntityType(
  'admin-crud-embedded-form',
  {
    parentType: adminSectionEntityType,
  },
);

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
    type: modelScalarFieldType,
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

// Form Fields

export const adminCrudTextInputSchema = z.object({
  type: z.literal('text'),
  label: z.string().min(1),
  modelField: zRef(z.string(), {
    type: modelScalarFieldType,
    onDelete: 'RESTRICT',
    parentPath: { context: 'model' },
  }),
  validation: z.string().optional(),
});

export type AdminCrudTextInputConfig = z.infer<typeof adminCrudTextInputSchema>;

export const adminCrudForeignInputSchema = z.object({
  type: z.literal('foreign'),
  label: z.string().min(1),
  localRelationName: zRef(z.string(), {
    type: modelLocalRelationEntityType,
    onDelete: 'RESTRICT',
    parentPath: { context: 'model' },
  }),
  labelExpression: z.string().min(1),
  valueExpression: z.string().min(1),
  defaultLabel: z.string().optional(),
  nullLabel: z.string().optional(),
});

export type AdminCrudForeignInputConfig = z.infer<
  typeof adminCrudForeignInputSchema
>;

export const adminCrudEnumInputSchema = z.object({
  type: z.literal('enum'),
  label: z.string().min(1),
  modelField: zRef(z.string(), {
    type: modelScalarFieldType,
    onDelete: 'RESTRICT',
    parentPath: { context: 'model' },
  }),
});

export type AdminCrudEnumInputConfig = z.infer<typeof adminCrudEnumInputSchema>;

export const adminCrudFileInputSchema = z.object({
  type: z.literal('file'),
  label: z.string().min(1),
  modelRelation: zRef(z.string(), {
    type: modelTransformerEntityType,
    onDelete: 'RESTRICT',
    parentPath: { context: 'model' },
  }),
});

export type AdminCrudFileInputConfig = z.infer<typeof adminCrudFileInputSchema>;

export const adminCrudEmbeddedInputSchema = z.object({
  type: z.literal('embedded'),
  label: z.string().min(1),
  modelRelation: zRef(z.string(), {
    type: modelForeignRelationEntityType,
    onDelete: 'RESTRICT',
    parentPath: { context: 'model' },
  }),
  embeddedFormName: zRef(z.string(), {
    type: adminCrudEmbeddedFormEntityType,
    parentPath: { context: 'admin-section' },
    onDelete: 'RESTRICT',
  }),
});

export type AdminCrudEmbeddedInputConfig = z.infer<
  typeof adminCrudEmbeddedInputSchema
>;

export const adminCrudEmbeddedLocalInputSchema = z.object({
  type: z.literal('embeddedLocal'),
  label: z.string().min(1),
  localRelation: zRef(z.string(), {
    type: modelLocalRelationEntityType,
    onDelete: 'RESTRICT',
    parentPath: { context: 'model' },
  }),
  embeddedFormName: zRef(z.string(), {
    type: adminCrudEmbeddedFormEntityType,
    parentPath: { context: 'admin-section' },
    onDelete: 'RESTRICT',
  }),
});

export type AdminCrudEmbeddedLocalInputConfig = z.infer<
  typeof adminCrudEmbeddedLocalInputSchema
>;

export const adminCrudPasswordInputSchema = z.object({
  type: z.literal('password'),
  label: z.string().min(1),
});

export type AdminCrudPasswordInputConfig = z.infer<
  typeof adminCrudPasswordInputSchema
>;

export const adminCrudInputSchema = z.discriminatedUnion('type', [
  adminCrudForeignInputSchema,
  adminCrudTextInputSchema,
  adminCrudEnumInputSchema,
  adminCrudFileInputSchema,
  adminCrudEmbeddedInputSchema,
  adminCrudEmbeddedLocalInputSchema,
  adminCrudPasswordInputSchema,
]);

export const adminCrudInputTypes = primitiveMapToKeys(
  adminCrudInputSchema.optionsMap,
);

export type AdminCrudInputConfig = z.infer<typeof adminCrudInputSchema>;

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
    fields: z.array(adminCrudInputSchema),
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
    fields: z.array(adminCrudInputSchema),
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
      fields: z.array(adminCrudInputSchema),
    }),
    embeddedForms: z.array(adminCrudEmbeddedFormSchema).optional(),
  }),
  (builder) => {
    builder.addPathToContext('modelName', modelEntityType, 'model');
  },
);

export type AdminCrudSectionConfig = z.infer<typeof adminCrudSectionSchema>;
