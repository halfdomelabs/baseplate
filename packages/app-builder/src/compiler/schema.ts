import * as yup from 'yup';
import { backendSchema } from './backend/schema';

export const appConfigSchema = yup.object({
  name: yup.string().required(),
  version: yup.string().required(),
  apps: yup
    .object({
      backend: backendSchema.nullable(),
    })
    .required(),
});

export type AppConfig = yup.InferType<typeof appConfigSchema>;
