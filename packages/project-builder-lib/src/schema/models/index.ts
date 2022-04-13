import * as yup from 'yup';
import { SCALAR_FIELD_TYPES } from '@src/types/fieldTypes';
import { randomUid } from '@src/utils/randomUid';
import { MakeUndefinableFieldsOptional } from '@src/utils/types';

export const modelScalarFieldSchema = yup.object({
  uid: yup.string().default(randomUid),
  name: yup.string().required(),
  type: yup
    .string()
    .oneOf([...SCALAR_FIELD_TYPES])
    .required(),
  isId: yup.boolean(),
  isOptional: yup.boolean(),
  isUnique: yup.boolean(),
  options: yup
    .object({
      // uuid options
      genUuid: yup.boolean(),
      // date options
      updatedAt: yup.boolean(),
      defaultToNow: yup.boolean(),
    })
    .default(undefined),
});

export type ModelScalarFieldConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof modelScalarFieldSchema>
>;

export const REFERENTIAL_ACTIONS = [
  'Cascade',
  'Restrict',
  'NoAction',
  'SetNull',
  'SetDefault',
];

export const modelRelationFieldSchema = yup.object({
  uid: yup.string().default(randomUid),
  name: yup.string().required(),
  references: yup
    .array(
      yup
        .object({
          local: yup.string().required(),
          foreign: yup.string().required(),
        })
        .required()
    )
    .required(),
  modelName: yup.string().required(),
  foreignRelationName: yup.string().required(),
  relationshipName: yup.string(),
  relationshipType: yup
    .string()
    .oneOf(['oneToOne', 'oneToMany'])
    .default('oneToMany'),
  isOptional: yup.boolean().default(false),
  onDelete: yup.string().oneOf(REFERENTIAL_ACTIONS).default('Cascade'),
  onUpdate: yup.string().oneOf(REFERENTIAL_ACTIONS).default('Restrict'),
});

export type ModelRelationFieldConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof modelRelationFieldSchema>
>;

export const modelSchema = yup.object({
  uid: yup.string().default(randomUid),
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
      create: yup
        .object({
          fields: yup.array(yup.string().required()).required(),
        })
        .default(undefined),
      update: yup
        .object({
          fields: yup.array(yup.string().required()).required(),
        })
        .default(undefined),
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
      exposedFields: yup.array(yup.string().required()),
      exposedLocalRelations: yup.array(yup.string().required()),
      exposedForeignRelations: yup.array(yup.string().required()),
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
