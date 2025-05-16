import type { Merge, SetOptional } from 'type-fest';

import type { ProjectDefinitionContainer } from '@src/definition/project-definition-container.js';
import type {
  ModelConfig,
  ModelConfigInput,
  ModelRelationFieldConfigInput,
  ModelScalarFieldConfigInput,
  ModelUniqueConstraintConfigInput,
  ProjectDefinition,
} from '@src/schema/index.js';
import type { DefinitionDiffOutput } from '@src/utils/definition-diff/definition-diff.js';

import { ModelUtils } from '@src/definition/index.js';
import {
  modelEntityType,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
  modelUniqueConstraintEntityType,
} from '@src/schema/index.js';
import {
  applyDefinitionDiff,
  createDefinitionDiff,
  createDefinitionDiffConfig,
  DefinitionDiffKeyedArrayField,
  DefinitionDiffReplacementField,
} from '@src/utils/definition-diff/definition-diff.js';

export type ModelMergerScalarFieldInput = SetOptional<
  ModelScalarFieldConfigInput,
  'id'
>;

export type ModelMergerRelationFieldInput = SetOptional<
  ModelRelationFieldConfigInput,
  'id' | 'foreignId'
>;

export type ModelMergerUniqueConstraintInput = SetOptional<
  ModelUniqueConstraintConfigInput,
  'id'
>;

/**
 * Computes a unique key for a unique constraint by sorting its field refs.
 *
 * @param constraint - Unique constraint input.
 * @returns A key string.
 */
function getUniqueConstraintKey(
  constraint: ModelMergerUniqueConstraintInput,
): string {
  const fields = constraint.fields.map((f) => f.fieldRef).sort();
  return fields.join('|');
}

export interface ModelMergerModelInput {
  model: Merge<
    ModelConfigInput['model'],
    {
      fields: ModelMergerScalarFieldInput[];
      relations?: ModelMergerRelationFieldInput[];
      uniqueConstraints?: ModelMergerUniqueConstraintInput[];
    }
  >;
}

export const modelMergerDefinitionDiffConfig =
  createDefinitionDiffConfig<ModelMergerModelInput>({
    'model.fields': new DefinitionDiffKeyedArrayField('fields', (f) => f.name),
    'model.relations': new DefinitionDiffKeyedArrayField(
      'relations',
      (r) => r.name,
    ),
    'model.uniqueConstraints': new DefinitionDiffKeyedArrayField(
      'uniqueConstraints',
      (c) => getUniqueConstraintKey(c),
    ),
    'model.primaryKeyFieldRefs': new DefinitionDiffReplacementField(
      'primaryKeyFieldRefs',
    ),
  });

export type ModelMergerDiffOutput = DefinitionDiffOutput<
  typeof modelMergerDefinitionDiffConfig
>;

/**
 * Serializes a model merger model input such that all IDs are replaced with
 * names.
 *
 * @param input - The model merger model input.
 * @param definitionContainer - The definition container.
 * @returns The serialized model merger model input.
 */
function serializeModelMergerModelInput(
  input: ModelMergerModelInput,
  definitionContainer: ProjectDefinitionContainer,
  siblingModels: ModelConfigInput[],
): ModelMergerModelInput {
  const siblingModelFieldIdMap = new Map([
    ...input.model.fields.map((f) => [f.id, f.name] as const),
    ...siblingModels.flatMap((m) =>
      m.model.fields.map((f) => [f.id, f.name] as const),
    ),
  ]);
  const nameFromId = (id: string): string =>
    siblingModelFieldIdMap.get(id) ?? definitionContainer.nameFromId(id);
  return {
    ...input,
    model: {
      ...input.model,
      relations: input.model.relations?.map((r) => ({
        ...r,
        references: r.references.map((reference) => ({
          ...reference,
          localRef: nameFromId(reference.localRef),
          foreignRef: nameFromId(reference.foreignRef),
        })),
      })),
      uniqueConstraints: input.model.uniqueConstraints?.map((c) => ({
        ...c,
        fields: c.fields.map((f) => ({
          ...f,
          fieldRef: nameFromId(f.fieldRef),
        })),
      })),
      primaryKeyFieldRefs: input.model.primaryKeyFieldRefs.map(nameFromId),
    },
  };
}

function attachIdsToModelMergerModelInput(
  input: ModelMergerModelInput,
): Pick<ModelConfigInput, 'model'> {
  return {
    ...input,
    model: {
      ...input.model,
      fields: input.model.fields.map((f) => ({
        ...f,
        id: f.id ?? modelScalarFieldEntityType.generateNewId(),
      })),
      relations: input.model.relations?.map((r) => ({
        ...r,
        id: r.id ?? modelLocalRelationEntityType.generateNewId(),
        foreignId:
          r.foreignId ?? modelForeignRelationEntityType.generateNewId(),
      })),
      uniqueConstraints: input.model.uniqueConstraints?.map((c) => ({
        ...c,
        id: c.id ?? modelUniqueConstraintEntityType.generateNewId(),
      })),
    },
  };
}

function deserializeModelMergerModelInput(
  input: ModelMergerModelInput,
  resolveForeignFieldRef: (modelId: string, fieldName: string) => string,
): Pick<ModelConfigInput, 'model'> {
  const inputWithIds = attachIdsToModelMergerModelInput(input);
  const resolveLocalFieldName = (name: string): string => {
    const field = inputWithIds.model.fields.find((f) => f.name === name);
    if (!field) {
      throw new Error(`Field ${name} not found`);
    }
    return field.id;
  };
  return {
    ...inputWithIds,
    model: {
      ...inputWithIds.model,
      relations: inputWithIds.model.relations?.map((relation) => ({
        ...relation,
        references: relation.references.map((reference) => ({
          ...reference,
          localRef: resolveLocalFieldName(reference.localRef),
          foreignRef: resolveForeignFieldRef(
            relation.modelRef,
            reference.foreignRef,
          ),
        })),
      })),
      uniqueConstraints: inputWithIds.model.uniqueConstraints?.map(
        (constraint) => ({
          ...constraint,
          fields: constraint.fields.map((field) => ({
            ...field,
            fieldRef: resolveLocalFieldName(field.fieldRef),
          })),
        }),
      ),
      primaryKeyFieldRefs: inputWithIds.model.primaryKeyFieldRefs.map(
        (fieldRef) => resolveLocalFieldName(fieldRef),
      ),
    },
  };
}

export function createNewModelConfigInput(
  name: string,
  featureRef: string,
): ModelConfigInput {
  return {
    id: modelEntityType.generateNewId(),
    name,
    featureRef,
    model: {
      fields: [],
      primaryKeyFieldRefs: [],
    },
  };
}

export interface PendingModelChange {
  isNewModel: boolean;
  id: string | undefined;
  name: string;
  changes: ModelMergerDiffOutput;
}

interface ModelMergerOptions {
  defaultName: string;
  defaultFeatureRef: string;
  siblingModels?: ModelConfigInput[];
}

/**
 * Diff the model definition.
 *
 * @param current - The current model definition or a new model to be created.
 * @param desired - The desired model definition.
 * @param definitionContainer - Project definition container.
 * @param options - Diff options.
 * @returns A diff output or undefined if there are no differences.
 */
export function createModelMergerResult(
  current: ModelConfigInput | undefined,
  desired: ModelMergerModelInput,
  definitionContainer: ProjectDefinitionContainer,
  { defaultName, defaultFeatureRef, siblingModels = [] }: ModelMergerOptions,
): PendingModelChange | undefined {
  const currentModel =
    current ?? createNewModelConfigInput(defaultName, defaultFeatureRef);
  // resolves all the names of the current model config input
  const resolvedCurrent = serializeModelMergerModelInput(
    currentModel,
    definitionContainer,
    siblingModels,
  );

  const diff = createDefinitionDiff(
    resolvedCurrent,
    desired,
    modelMergerDefinitionDiffConfig,
  );

  if (!diff) {
    return undefined;
  }

  return {
    isNewModel: !current,
    id: currentModel.id,
    name: currentModel.name,
    changes: diff,
  };
}

export function applyModelMergerDiff(
  model: ModelConfigInput,
  diff: ModelMergerDiffOutput,
  definitionContainer: ProjectDefinitionContainer,
  siblingModels: ModelConfigInput[] = [],
): ModelConfigInput {
  const resolvedCurrent = serializeModelMergerModelInput(
    model,
    definitionContainer,
    siblingModels,
  );
  const patchedCurrent = applyDefinitionDiff(
    resolvedCurrent,
    diff,
    modelMergerDefinitionDiffConfig,
  );
  return {
    ...model,
    ...deserializeModelMergerModelInput(
      patchedCurrent,
      (modelId, fieldName) => {
        const siblingModel = siblingModels.find((m) => m.id === modelId);
        if (siblingModel) {
          const field = siblingModel.model.fields.find(
            (f) => f.name === fieldName,
          );
          if (!field) {
            throw new Error(
              `Field ${fieldName} not found in sibling model ${modelId}`,
            );
          }
          return field.id;
        }
        const model = ModelUtils.byIdOrThrow(
          definitionContainer.definition,
          modelId,
        );
        const field = model.model.fields.find((f) => f.name === fieldName);
        if (!field) {
          throw new Error(
            `Field ${fieldName} not found in model ${model.name}`,
          );
        }
        return field.id;
      },
    ),
  };
}

export function applyModelMergerResultInPlace(
  definition: ProjectDefinition,
  result: PendingModelChange,
  definitionContainer: ProjectDefinitionContainer,
  { defaultName, defaultFeatureRef, siblingModels = [] }: ModelMergerOptions,
): ModelConfigInput {
  const model = result.id
    ? ModelUtils.byIdOrThrow(definitionContainer.definition, result.id)
    : createNewModelConfigInput(defaultName, defaultFeatureRef);

  const newModel = applyModelMergerDiff(
    model,
    result.changes,
    definitionContainer,
    siblingModels,
  );
  if (result.isNewModel) {
    definition.models.push(newModel as ModelConfig);
  } else {
    const index = definition.models.findIndex((m) => m.id === result.id);
    if (index === -1) {
      throw new Error(`Model ${result.id} not found`);
    }
    definition.models[index] = newModel as ModelConfig;
  }
  return newModel;
}
