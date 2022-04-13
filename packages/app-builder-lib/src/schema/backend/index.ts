import * as yup from 'yup';
import { MakeUndefinableFieldsOptional } from '@src/utils/types';
import { appBaseValidators } from '../app';

export const backendSchema = yup.object({
  ...appBaseValidators,
  type: yup.mixed<'backend'>().oneOf(['backend']).required(),
});

export type BackendConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof backendSchema>
>;
