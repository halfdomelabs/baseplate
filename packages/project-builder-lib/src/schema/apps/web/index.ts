import * as yup from 'yup';
import { MakeUndefinableFieldsOptional } from '@src/utils/types';
import { baseAppValidators } from '../base';

export const webAppSchema = yup.object({
  ...baseAppValidators,
  type: yup.mixed<'web'>().oneOf(['web']).required(),
  includeAuth: yup.boolean(),
});

export type WebAppConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof webAppSchema>
>;
