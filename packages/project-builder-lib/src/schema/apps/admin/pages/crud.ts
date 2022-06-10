import { z } from 'zod';
import { ReferencesBuilder } from '@src/schema/references';
import { baseAdminSectionValidators } from './base';

export const adminCrudSectionSchema = z.object({
  ...baseAdminSectionValidators,
  type: z.literal('crud'),
  title: z.string().min(1),
  model: z.string().min(1),
  table: z.object({
    fields: z.array(
      z.object({
        name: z.string().min(1),
        label: z.string().min(1),
      })
    ),
  }),
  form: z.object({
    fields: z.array(
      z.object({
        name: z.string().min(1),
        label: z.string().min(1),
      })
    ),
  }),
});

export type AdminCrudSectionConfig = z.infer<typeof adminCrudSectionSchema>;

export function buildAdminCrudSectionReferences(
  config: AdminCrudSectionConfig,
  builder: ReferencesBuilder<AdminCrudSectionConfig>
): void {
  builder.addReference('model', { category: 'model' });
  builder.addReferences('table.fields.*.name', {
    category: 'modelField',
    generateKey: (name) => `${config.model}.${name}`,
  });
  builder.addReferences('form.fields.*.name', {
    category: 'modelField',
    generateKey: (name) => `${config.model}.${name}`,
  });
}
