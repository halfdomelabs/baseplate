import { SCALAR_FIELD_TYPES } from '@baseplate/fastify-generators';
import * as yup from 'yup';

export const modelScalarFieldSchema = yup.object({
  name: yup.string().required(),
  type: yup
    .string()
    .oneOf([...SCALAR_FIELD_TYPES])
    .required(),
  id: yup.boolean(),
  optional: yup.boolean(),
  unique: yup.boolean(),
  genUuid: yup.boolean(),
  creatable: yup.boolean(),
  updatable: yup.boolean(),
  exposed: yup.boolean(),
});

export type ModelFieldConfig = yup.InferType<typeof modelScalarFieldSchema>;

export const modelSchema = yup.object({
  name: yup.string().required(),
  feature: yup.string().required(),
  fields: yup.array(modelScalarFieldSchema.required()),
  hasTimestamp: yup.boolean(),
  generatedAddons: yup.array(yup.string().oneOf(['auth']).required()),
  generateService: yup.boolean(),
  exposedQuery: yup.boolean(),
  exposedMutations: yup.boolean(),
});

export type ModelConfig = yup.InferType<typeof modelSchema>;
