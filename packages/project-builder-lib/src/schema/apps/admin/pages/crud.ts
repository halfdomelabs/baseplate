import * as yup from 'yup';
import { ReferencesBuilder } from '@src/schema/references';
import { MakeUndefinableFieldsOptional } from '@src/utils/types';
import { baseAdminSectionValidators } from './base';

export const adminCrudSectionSchema = yup.object({
  ...baseAdminSectionValidators,
  type: yup.mixed<'crud'>().oneOf(['crud']).required(),
  title: yup.string().required(),
  model: yup.string().required(),
  table: yup.object({
    fields: yup.array().of(
      yup.object({
        name: yup.string().required(),
        label: yup.string().required(),
      })
    ),
  }),
  form: yup.object({
    fields: yup.array().of(
      yup.object({
        name: yup.string().required(),
        label: yup.string().required(),
      })
    ),
  }),
});

export type AdminCrudSectionConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof adminCrudSectionSchema>
>;

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
