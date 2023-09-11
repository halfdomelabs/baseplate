import { z } from 'zod';
import { ReferencesBuilder } from '@src/schema/references.js';
import { notEmpty } from '@src/utils/array.js';
import { randomUid } from '@src/utils/randomUid.js';
import { baseAdminSectionValidators } from './base.js';

// Table Columns
export const adminCrudForeignDisplaySchema = z.object({
  type: z.literal('foreign'),
  localRelationName: z.string().min(1),
  labelExpression: z.string().min(1),
  valueExpression: z.string().min(1),
});

export type AdminCrudForeignDisplayConfig = z.infer<
  typeof adminCrudForeignDisplaySchema
>;

export const adminCrudTextDisplaySchema = z.object({
  type: z.literal('text'),
  modelField: z.string().min(1),
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
  modelField: z.string().min(1),
  validation: z.string().optional(),
});

export type AdminCrudTextInputConfig = z.infer<typeof adminCrudTextInputSchema>;

export const adminCrudForeignInputSchema = z.object({
  type: z.literal('foreign'),
  label: z.string().min(1),
  localRelationName: z.string().min(1),
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
  modelField: z.string().min(1),
});

export type AdminCrudEnumInputConfig = z.infer<typeof adminCrudEnumInputSchema>;

export const adminCrudFileInputSchema = z.object({
  type: z.literal('file'),
  label: z.string().min(1),
  modelRelation: z.string().min(1),
});

export type AdminCrudFileInputConfig = z.infer<typeof adminCrudFileInputSchema>;

export const adminCrudEmbeddedInputSchema = z.object({
  type: z.literal('embedded'),
  label: z.string().min(1),
  modelRelation: z.string().min(1),
  embeddedFormName: z.string().min(1),
});

export type AdminCrudEmbeddedInputConfig = z.infer<
  typeof adminCrudEmbeddedInputSchema
>;

export const adminCrudEmbeddedLocalInputSchema = z.object({
  type: z.literal('embeddedLocal'),
  label: z.string().min(1),
  localRelation: z.string().min(1),
  embeddedFormName: z.string().min(1),
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
  id: z.string().default(randomUid),
  name: z.string().min(1),
  modelName: z.string().min(1),
  includeIdField: z.boolean().optional(),
  type: z.literal('object'),
  form: z.object({
    fields: z.array(adminCrudInputSchema),
  }),
});

export const adminCrudEmbeddedListSchema = z.object({
  id: z.string().default(randomUid),
  name: z.string().min(1),
  modelName: z.string().min(1),
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

export const adminCrudEmbeddedFormSchema = z.discriminatedUnion('type', [
  adminCrudEmbeddedObjectSchema,
  adminCrudEmbeddedListSchema,
]);

export type AdminCrudEmbeddedFormConfig = z.infer<
  typeof adminCrudEmbeddedFormSchema
>;

// Admin Section

export const adminCrudSectionSchema = z.object({
  ...baseAdminSectionValidators,
  type: z.literal('crud'),
  modelName: z.string().min(1),
  disableCreate: z.boolean().optional(),
  table: z.object({
    columns: z.array(adminCrudTableColumnSchema),
  }),
  form: z.object({
    fields: z.array(adminCrudInputSchema),
  }),
  embeddedForms: z.array(adminCrudEmbeddedFormSchema).optional(),
});

export type AdminCrudSectionConfig = z.infer<typeof adminCrudSectionSchema>;

export function buildAdminCrudSectionReferences(
  config: AdminCrudSectionConfig,
  builder: ReferencesBuilder<AdminCrudSectionConfig>,
): void {
  builder.addReference('modelName', { category: 'model' });

  config.table.columns.forEach((column, idx) => {
    const columnBuilder = builder.withPrefix(`table.columns.${idx}`);
    switch (column.display.type) {
      case 'foreign':
        columnBuilder.addReference('display.localRelationName', {
          category: 'modelLocalRelation',
          key: `${config.modelName}#${column.display.localRelationName}`,
        });
        break;
      case 'text':
        columnBuilder.addReference('display.modelField', {
          category: 'modelField',
          key: `${config.modelName}#${column.display.modelField}`,
        });
        break;
      default:
        throw new Error(
          `Unknown display type: ${(column.display as { type: string }).type}`,
        );
    }
  });

  config.form.fields.forEach((field, idx) => {
    const fieldBuilder = builder.withPrefix(`form.fields.${idx}`);
    switch (field.type) {
      case 'text':
        fieldBuilder.addReference('modelField', {
          category: 'modelField',
          key: `${config.modelName}#${field.modelField}`,
        });
        break;
      case 'foreign':
        fieldBuilder.addReference('localRelationName', {
          category: 'modelLocalRelation',
          key: `${config.modelName}#${field.localRelationName}`,
        });
        break;
      case 'enum':
        fieldBuilder.addReference('modelField', {
          category: 'modelField',
          key: `${config.modelName}#${field.modelField}`,
        });
        break;
      case 'file':
        fieldBuilder.addReference('modelRelation', {
          category: 'modelTransformer',
          key: `${config.modelName}#${field.modelRelation}`,
        });
        break;
      case 'embedded':
        fieldBuilder.addReference('modelRelation', {
          category: 'modelForeignRelation',
          key: `${config.modelName}#${field.modelRelation}`,
        });
        fieldBuilder.addReference('embeddedFormName', {
          category: 'adminCrudEmbeddedForm',
          key: `${config.name}#${field.embeddedFormName}`,
        });
        break;
      case 'embeddedLocal':
        // TODO: Not supported in backend generation yet (but can be manually created)
        fieldBuilder.addReference('localRelation', {
          category: 'modelLocalRelation',
          key: `${config.modelName}#${field.localRelation}`,
        });
        fieldBuilder.addReference('embeddedFormName', {
          category: 'adminCrudEmbeddedForm',
          key: `${config.name}#${field.embeddedFormName}`,
        });
        break;
      case 'password':
        break;
      default:
        throw new Error(
          `Unknown input type: ${(field as { type: string }).type}`,
        );
    }
  });

  config.embeddedForms?.forEach((form, idx) => {
    const formBuilder = builder.withPrefix(`embeddedForms.${idx}`);
    formBuilder.addReferenceable({
      id: form.id,
      name: form.name,
      key: `${config.name}#${form.name}`,
      category: 'adminCrudEmbeddedForm',
    });
  });
}
