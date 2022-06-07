import * as yup from 'yup';
import { ReferencesBuilder } from '@src/schema/references';
import { MakeUndefinableFieldsOptional } from '@src/utils/types';
import { baseAppValidators } from '../base';

export const adminAppSchema = yup.object({
  ...baseAppValidators,
  type: yup.mixed<'admin'>().oneOf(['admin']).required(),
  allowedRoles: yup.array().of(yup.string().required()),
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
}
