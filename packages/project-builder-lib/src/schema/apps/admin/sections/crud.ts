import { z } from 'zod';
import { ReferencesBuilder } from '@src/schema/references';
import { baseAdminSectionValidators } from './base';

// Table Columns

export const adminCrudTextRendererSchema = z.object({
  type: z.literal('text'),
  field: z.string().min(1),
});

export type AdminCrudTextRendererConfig = z.infer<
  typeof adminCrudTextRendererSchema
>;

export const adminCrudRendererSchema = adminCrudTextRendererSchema;

export const adminCrudTableColumnSchema = z.object({
  label: z.string().min(1),
  renderer: adminCrudRendererSchema,
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
});

export type AdminCrudForeignInputConfig = z.infer<
  typeof adminCrudForeignInputSchema
>;

export const adminCrudInputSchema = z.discriminatedUnion('type', [
  adminCrudForeignInputSchema,
  adminCrudTextInputSchema,
]);

export const adminCrudInputTypes =
  adminCrudInputSchema.validDiscriminatorValues as string[];

export type AdminCrudInputConfig = z.infer<typeof adminCrudInputSchema>;

// Admin Section

export const adminCrudSectionSchema = z.object({
  ...baseAdminSectionValidators,
  type: z.literal('crud'),
  modelName: z.string().min(1),
  table: z.object({
    columns: z.array(adminCrudTableColumnSchema),
  }),
  form: z.object({
    fields: z.array(adminCrudInputSchema),
  }),
});

export type AdminCrudSectionConfig = z.infer<typeof adminCrudSectionSchema>;

export function buildAdminCrudSectionReferences(
  config: AdminCrudSectionConfig,
  builder: ReferencesBuilder<AdminCrudSectionConfig>
): void {
  builder.addReference('modelName', { category: 'model' });

  config.table.columns.forEach((column, idx) => {
    const columnBuilder = builder.withPrefix(`table.columns.${idx}`);
    switch (column.renderer.type) {
      case 'text':
        columnBuilder.addReference('renderer.field', {
          category: 'modelField',
          key: `${config.modelName}#${column.renderer.field}`,
        });
        break;
      default:
        throw new Error(
          `Unknown renderer type: ${column.renderer.type as string}`
        );
    }
  });

  config.form.fields.forEach((field, idx) => {
    const fieldBuilder = builder.withPrefix(`form.fields.${idx}`);
    switch (field.type) {
      case 'text':
        fieldBuilder.addReference('modelField', {
          category: 'modelField',
          key: `${config.modelName}#${field.modelField || ''}`,
        });
        break;
      case 'foreign':
        fieldBuilder.addReference('localRelationName', {
          category: 'modelLocalRelation',
          key: `${config.modelName}#${field.localRelationName || ''}`,
        });
        break;
      default:
        throw new Error(
          `Unknown input type: ${(field as { type: string }).type}`
        );
    }
  });
}
