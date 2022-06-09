import * as yup from 'yup';
import { ReferencesBuilder } from '@src/schema/references';
import { MakeUndefinableFieldsOptional } from '@src/utils/types';
import { baseAppValidators } from '../base';
import { AdminCrudSectionConfig } from './pages';
import {
  adminCrudSectionSchema,
  buildAdminCrudSectionReferences,
} from './pages/crud';

export type AdminSectionConfig = AdminCrudSectionConfig;

export const adminAppSchema = yup.object({
  ...baseAppValidators,
  type: yup.mixed<'admin'>().oneOf(['admin']).required(),
  allowedRoles: yup.array().of(yup.string().required()),
  sections: yup.array().of(
    yup.lazy((value: AdminSectionConfig) => {
      if (value.type === 'crud') {
        return adminCrudSectionSchema;
      }
      throw new Error(
        `Unknown app type: ${(value as unknown as AdminSectionConfig).type}`
      );
    }) as unknown as yup.SchemaOf<AdminSectionConfig>
  ),
});

export type AdminAppConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof adminAppSchema>
>;

export function buildAdminAppReferences(
  config: AdminAppConfig,
  builder: ReferencesBuilder<AdminAppConfig>
): void {
  builder.addReferences('allowedRoles.*', {
    category: 'role',
  });

  config.sections?.forEach((page, index) => {
    switch (page.type) {
      case 'crud':
        buildAdminCrudSectionReferences(
          page,
          builder.withPrefix(`sections.${index}`)
        );
        break;
      default:
        throw new Error(
          `Unknown page type: ${(page as AdminSectionConfig).type}`
        );
    }
  });
}
