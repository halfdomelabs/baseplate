import * as yup from 'yup';
import { SCALAR_FIELD_TYPES } from '@src/types/fieldTypes';
import { MakeUndefinableFieldsOptional } from '@src/utils/types';

export const modelScalarFieldSchema = yup.object({
  name: yup.string().required(),
  type: yup
    .string()
    .oneOf([...SCALAR_FIELD_TYPES])
    .required(),
  id: yup.boolean(),
  optional: yup.boolean(),
  unique: yup.boolean(),
  // uuid options
  genUuid: yup.boolean(),
  // date options
  updatedAt: yup.boolean(),
  defaultToNow: yup.boolean(),
  // service/schema options
  creatable: yup.boolean(),
  updatable: yup.boolean(),
  exposed: yup.boolean(),
});

export type ModelScalarFieldConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof modelScalarFieldSchema>
>;

const REFERENTIAL_ACTIONS = [
  'Cascade',
  'Restrict',
  'NoAction',
  'SetNull',
  'SetDefault',
];

export const modelRelationFieldSchema = yup.object({
  name: yup.string().required(),
  fields: yup.array(yup.string().required()).required(),
  references: yup.array(yup.string().required()).required(),
  modelName: yup.string().required(),
  foreignFieldName: yup.string(),
  relationshipName: yup.string(),
  relationshipType: yup
    .string()
    .oneOf(['oneToOne', 'oneToMany'])
    .default('oneToMany'),
  optional: yup.boolean().default(false),
  onDelete: yup.string().oneOf(REFERENTIAL_ACTIONS).default('Cascade'),
  onUpdate: yup.string().oneOf(REFERENTIAL_ACTIONS).default('Restrict'),
  exposed: yup.boolean(),
});

export type ModelRelationFieldConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof modelRelationFieldSchema>
>;

export const modelSchema = yup.object({
  name: yup.string().required(),
  feature: yup.string().required(),
  fields: yup.array(modelScalarFieldSchema.required()),
  relations: yup.array(modelRelationFieldSchema.required()),
  primaryKeys: yup.array(yup.string().required()),
  generateService: yup.boolean(),
  exposedObjectType: yup.boolean(),
  exposedQuery: yup.boolean(),
  exposedMutations: yup.boolean(),
  // authorize options
  authorizeRead: yup.array(yup.string().required()),
  authorizeCreate: yup.array(yup.string().required()),
  authorizeUpdate: yup.array(yup.string().required()),
  authorizeDelete: yup.array(yup.string().required()),
  // embedded service transformers
  embeddedRelations: yup.array(
    yup
      .object({
        localRelationName: yup.string().required(),
        embeddedFieldNames: yup.array(yup.string().required()).required(),
      })
      .required()
  ),
});

export type ModelConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof modelSchema>
>;
