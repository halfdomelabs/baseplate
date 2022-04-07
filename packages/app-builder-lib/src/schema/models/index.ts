import * as yup from 'yup';
import { SCALAR_FIELD_TYPES } from '@src/types/fieldTypes';
import { MakeUndefinableFieldsOptional } from '@src/utils/types';

export const modelScalarFieldSchema = yup.object({
  name: yup.string().required(),
  model: yup
    .object({
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
    })
    .required(),
  service: yup
    .object({
      creatable: yup.boolean(),
      updatable: yup.boolean(),
    })
    .default(undefined),
  schema: yup
    .object({
      exposed: yup.boolean(),
    })
    .default(undefined),
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
  model: yup.object({
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
  }),
  schema: yup
    .object({
      exposed: yup.boolean(),
    })
    .default(undefined),
});

export type ModelRelationFieldConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof modelRelationFieldSchema>
>;

export const modelSchema = yup.object({
  name: yup.string().required(),
  feature: yup.string().required(),
  model: yup.object({
    fields: yup.array(modelScalarFieldSchema.required()).required(),
    relations: yup.array(modelRelationFieldSchema.required()),
    primaryKeys: yup.array(yup.string().required()),
  }),
  service: yup
    .object({
      build: yup.boolean(),
      embeddedRelations: yup.array(
        yup.object({
          localRelationName: yup.string().required(),
          embeddedFieldNames: yup.array(yup.string().required()).required(),
        })
      ),
    })
    .default(undefined),
  schema: yup
    .object({
      buildObjectType: yup.boolean(),
      buildQuery: yup.boolean(),
      buildMutations: yup.boolean(),
      authorize: yup.object({
        read: yup.array(yup.string().required()),
        create: yup.array(yup.string().required()),
        update: yup.array(yup.string().required()),
        delete: yup.array(yup.string().required()),
      }),
    })
    .default(undefined),
});

export type ModelConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof modelSchema>
>;
