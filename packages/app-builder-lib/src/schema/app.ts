import * as yup from 'yup';

export const appBaseValidators = {
  name: yup.string().required(),
  type: yup.string().required(),
  packageLocation: yup.string(),
} as const;
