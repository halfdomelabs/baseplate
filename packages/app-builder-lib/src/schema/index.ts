import * as yup from 'yup';
import { MakeUndefinableFieldsOptional } from '@src/utils/types';
import { authSchema } from './auth';
import { backendSchema } from './backend';
import { modelSchema } from './models';

export const appConfigSchema = yup.object({
  name: yup.string().required(),
  version: yup.string().required(),
  // port to base the app ports on for development (e.g. 8000 => 8432 for DB)
  portBase: yup.number().required(),
  apps: yup
    .object({
      backend: backendSchema.nullable(),
    })
    .required(),
  features: yup.array(yup.string().required()),
  models: yup.array(modelSchema),
  auth: authSchema.optional().default(undefined),
});

export type AppConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof appConfigSchema>
>;
