import * as yup from 'yup';
import { MakeUndefinableFieldsOptional } from '@src/utils/types';
import { baseAppValidators } from '../base';

export const backendAppSchema = yup.object({
  ...baseAppValidators,
  type: yup.mixed<'backend'>().oneOf(['backend']).required(),
});

export type BackendAppConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof backendAppSchema>
>;
