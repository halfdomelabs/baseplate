import * as yup from 'yup';

export const backendSchema = yup.object({
  packageLocation: yup.string(),
});
