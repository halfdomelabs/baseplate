import { z } from 'zod';
import { ReferencesBuilder } from '@src/schema/references';
import { baseAdminSectionValidators } from './base';

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

export const adminCrudTextInputSchema = z.object({
  type: z.literal('text'),
  field: z.string().min(1),
});

export const adminCrudInputSchema = adminCrudTextInputSchema;

export const adminCrudFormFieldSchema = z.object({
  label: z.string().min(1),
  input: adminCrudTextInputSchema,
});

export const adminCrudSectionSchema = z.object({
  ...baseAdminSectionValidators,
  type: z.literal('crud'),
  modelName: z.string().min(1),
  table: z.object({
    columns: z.array(adminCrudTableColumnSchema),
  }),
  form: z.object({
    fields: z.array(adminCrudFormFieldSchema),
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
          key: `${config.modelName}.${column.renderer.field}`,
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
    switch (field.input.type) {
      case 'text':
        fieldBuilder.addReference('input.field', {
          category: 'modelField',
          key: `${config.modelName}.${field.input.field}`,
        });
        break;
      default:
        throw new Error(`Unknown input type: ${field.input.type as string}`);
    }
  });
}
