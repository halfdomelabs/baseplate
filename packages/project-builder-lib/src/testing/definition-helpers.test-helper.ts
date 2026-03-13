import type { FeatureConfig } from '#src/schema/features/feature.js';
import type {
  ModelConfig,
  ModelConfigInput,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
  ModelScalarFieldConfigInput,
  ModelUniqueConstraintConfig,
} from '#src/schema/models/index.js';

import { featureEntityType } from '#src/schema/features/feature.js';
import {
  modelEntityType,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
  modelUniqueConstraintEntityType,
} from '#src/schema/models/index.js';
import { createModelSchema } from '#src/schema/models/models.js';

import { createEmptyParserContext } from './parser-context.test-helper.js';

const TEST_WORDS = [
  'alpha',
  'bravo',
  'charlie',
  'delta',
  'echo',
  'foxtrot',
  'golf',
  'hotel',
  'india',
  'juliet',
  'kilo',
  'lima',
  'mike',
  'november',
  'oscar',
  'papa',
  'quebec',
  'romeo',
  'sierra',
  'tango',
];

let testWordCounter = 0;

function getTestWord(): string {
  const word = TEST_WORDS[testWordCounter % TEST_WORDS.length];
  testWordCounter++;
  return word;
}

function getTestPascalWord(): string {
  const word = getTestWord();
  return word.charAt(0).toUpperCase() + word.slice(1);
}

const modelSchema = createModelSchema(createEmptyParserContext());

export function createTestFeature(
  feature: Partial<FeatureConfig> = {},
): FeatureConfig {
  return {
    id: featureEntityType.generateNewId(),
    name: getTestWord(),
    ...feature,
  };
}

export function createTestModel(
  model: Partial<ModelConfigInput> = {},
): ModelConfig {
  const input: ModelConfigInput = {
    id: modelEntityType.generateNewId(),
    name: getTestPascalWord(),
    featureRef: 'mockFeature',
    ...model,
    model: {
      fields: [
        {
          id: modelScalarFieldEntityType.generateNewId(),
          name: 'id',
          type: 'uuid',
          options: { genUuid: true, default: '123' },
          isOptional: false,
        },
      ],
      primaryKeyFieldRefs: ['id'],
      ...model.model,
    },
    service: {
      create: { enabled: false },
      update: { enabled: false },
      delete: { enabled: false },
      transformers: [],
      ...model.service,
    },
  };
  return modelSchema.parse(input);
}

export function createTestScalarField<
  TType extends ModelScalarFieldConfig['type'] = 'string',
>(
  field: Partial<ModelScalarFieldConfigInput & { type: TType }> = {},
): ModelScalarFieldConfig & { type: TType } {
  return {
    id: modelScalarFieldEntityType.generateNewId(),
    name: getTestWord(),
    type: 'string',
    isOptional: false,
    ...field,
    options: {
      default: '123',
      ...field.options,
    },
  } as ModelScalarFieldConfig & { type: TType };
}

export function createTestRelationField(
  relation?: Partial<ModelRelationFieldConfig>,
): ModelRelationFieldConfig {
  return {
    id: modelLocalRelationEntityType.generateNewId(),
    foreignId: modelForeignRelationEntityType.generateNewId(),
    name: 'mockRelation',
    modelRef: 'mockModel',
    foreignRelationName: 'mockForeignRelation',
    references: [],
    onDelete: 'Cascade',
    onUpdate: 'Restrict',
    ...relation,
  };
}

export function createTestUniqueConstraint(
  constraint?: Partial<ModelUniqueConstraintConfig>,
): ModelUniqueConstraintConfig {
  return {
    id: modelUniqueConstraintEntityType.generateNewId(),
    fields: [],
    ...constraint,
  };
}
