import type { Merge, SetOptional } from 'type-fest';

import { mapValues } from 'es-toolkit';

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

type ModelMergerRelationFieldInput = SetOptional<
  ModelRelationFieldConfigInput,
  'id' | 'foreignId'
>;

type ModelMergerUniqueConstraintInput = SetOptional<
  ModelUniqueConstraintConfigInput,
  'id'
>;

/**
 * Input for the model merger for a particular model.
 */
export interface ModelMergerModelInput {
  name: string;
  featureRef: string;
  model: Merge<
    ModelConfigInput['model'],
    {
      fields: ModelMergerScalarFieldInput[];
      relations?: ModelMergerRelationFieldInput[];
      uniqueConstraints?: ModelMergerUniqueConstraintInput[];
    }
  >;
}

export type ModelMergerModelsInput = Record<string, ModelMergerModelInput>;

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

export type ModelMergerDefinitionDiffOutput = DefinitionDiffOutput<
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

/**
 * Attaches IDs to the model merger model input.
 *
 * @param input - The model merger model input.
 * @returns The model merger model input with IDs attached.
 */
function attachIdsToModelMergerModelInput(
  input: ModelMergerModelInput,
): Pick<ModelConfigInput, keyof ModelMergerModelInput> {
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

/**
 * Deserializes a model merger model input converting all names to IDs.
 *
 * @param input - The model merger model input.
 * @param resolveForeignFieldRef - A function that resolves the foreign field ref.
 * @returns The deserialized model merger model input.
 */
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

/**
 * Creates a new blank model config input from a name and feature ref.
 *
 * @param name - The name of the model.
 * @param featureRef - The feature ref of the model.
 * @returns The new model config input.
 */
function createNewModelConfigInput(
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

/**
 * Result of a model merger diff for a specific model.
 */
export interface ModelMergerModelDiffResult {
  isNewModel: boolean;
  id: string;
  name: string;
  featureRef: string;
  changes: ModelMergerDefinitionDiffOutput;
}

interface ModelMergerOptions {
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
  { siblingModels = [] }: ModelMergerOptions = {},
): ModelMergerModelDiffResult | undefined {
  const currentModel =
    current ?? createNewModelConfigInput(desired.name, desired.featureRef);
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
    featureRef: currentModel.featureRef,
    changes: diff,
  };
}

/**
 * Creates a model merger result for a set of models.
 *
 * @param current - A map of model IDs
 * @param desired - The desired model definition.
 * @param definitionContainer - Project definition container.
 * @param options - Diff options.
 * @returns A model merger result for a set of models.
 */
export function createModelMergerResults<T extends ModelMergerModelsInput>(
  current: Record<keyof T, string | undefined>,
  desired: T,
  definitionContainer: ProjectDefinitionContainer,
  { siblingModels = [] }: ModelMergerOptions = {},
): Record<keyof T, ModelMergerModelDiffResult | undefined> {
  return mapValues(desired, (desired, key) =>
    createModelMergerResult(
      current[key] && modelEntityType.isId(current[key])
        ? ModelUtils.byIdOrThrow(definitionContainer.definition, current[key])
        : undefined,
      desired,
      definitionContainer,
      {
        siblingModels,
      },
    ),
  );
}

export function applyModelMergerDiff(
  model: ModelConfigInput,
  diff: ModelMergerDefinitionDiffOutput,
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
  draftConfig: ProjectDefinition,
  result: ModelMergerModelDiffResult,
  definitionContainer: ProjectDefinitionContainer,
  { siblingModels = [] }: ModelMergerOptions = {},
): string {
  const model = result.isNewModel
    ? createNewModelConfigInput(result.name, result.featureRef)
    : ModelUtils.byIdOrThrow(definitionContainer.definition, result.id);

  const newModel = applyModelMergerDiff(
    model,
    result.changes,
    definitionContainer,
    siblingModels,
  );
  if (result.isNewModel) {
    draftConfig.models.push(newModel as ModelConfig);
  } else {
    const index = draftConfig.models.findIndex((m) => m.id === result.id);
    if (index === -1) {
      throw new Error(`Model ${result.id} not found`);
    }
    draftConfig.models[index] = newModel as ModelConfig;
  }
  return newModel.id;
}

export function createAndApplyModelMergerResults<
  T extends ModelMergerModelsInput,
>(
  draftConfig: ProjectDefinition,
  current: Record<keyof T, string | undefined>,
  desired: T,
  definitionContainer: ProjectDefinitionContainer,
  { siblingModels = [] }: ModelMergerOptions = {},
): Record<keyof T, string> {
  const results = createModelMergerResults(
    current,
    desired,
    definitionContainer,
    { siblingModels },
  );
  return mapValues(results, (result, key) =>
    result
      ? applyModelMergerResultInPlace(
          draftConfig,
          result,
          definitionContainer,
          { siblingModels },
        )
      : desired[key].name,
  );
}
