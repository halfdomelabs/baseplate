import * as yup from 'yup';
import { MakeUndefinableFieldsOptional } from '@src/utils/types';

export const baseAdminSectionValidators = {
  uid: yup.string().required(),
  title: yup.string().required(),
  icon: yup.string(),
  feature: yup.string().required(),
  type: yup.mixed<'crud'>().oneOf(['crud']).required(),
};

export const adminSectionSchema = yup.object(baseAdminSectionValidators);

export type AdminSectionConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof adminSectionSchema>
>;
