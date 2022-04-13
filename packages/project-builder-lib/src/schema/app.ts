import * as yup from 'yup';
import { MakeUndefinableFieldsOptional } from '@src/utils/types';
import { randomUid } from '../utils/randomUid';

export const baseAppValidators = {
  uid: yup.string().default(randomUid),
  name: yup.string().required(),
  type: yup.mixed<'backend'>().oneOf(['backend']).required(),
  packageLocation: yup.string(),
} as const;

export const baseAppSchema = yup.object(baseAppValidators);

export type BaseAppConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof baseAppSchema>
>;
