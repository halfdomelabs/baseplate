import * as yup from 'yup';
import { ReferencesBuilder } from '@src/schema/references';
import { MakeUndefinableFieldsOptional } from '@src/utils/types';
import { baseAppValidators } from '../base';

export const webAppSchema = yup.object({
  ...baseAppValidators,
  type: yup.mixed<'web'>().oneOf(['web']).required(),
  includeAuth: yup.boolean(),
  title: yup.string(),
  description: yup.string(),
  allowedRoles: yup.array().of(yup.string().required()),
});

export type WebAppConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof webAppSchema>
>;

export function buildWebAppReferences(
  config: WebAppConfig,
  builder: ReferencesBuilder<WebAppConfig>
): void {
  builder.addReferences('allowedRoles.*', {
    category: 'role',
  });
}
