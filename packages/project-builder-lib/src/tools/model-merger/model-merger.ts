import type { Merge, SetOptional } from 'type-fest';

import { mapValues } from 'es-toolkit';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type {
  ModelConfig,
  ModelConfigInput,
  ModelGraphqlInput,
  ModelRelationFieldConfigInput,
  ModelScalarFieldConfigInput,
  ModelUniqueConstraintConfigInput,
  ProjectDefinition,
} from '#src/schema/index.js';
import type { DefinitionDiffOutput } from '#src/utils/definition-diff/definition-diff.js';

import { ModelUtils } from '#src/definition/index.js';
import {
  modelEntityType,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
  modelUniqueConstraintEntityType,
} from '#src/schema/index.js';
import {
  applyDefinitionDiff,
  createDefinitionDiff,
  createDefinitionDiffConfig,
  DefinitionDiffArrayIncludesField,
  DefinitionDiffKeyedArrayField,
  DefinitionDiffReplacementField,
} from '#src/utils/definition-diff/definition-diff.js';

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
  graphql?: Pick<ModelGraphqlInput, 'objectType'>;
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
      'unique constraints',
      (c) => getUniqueConstraintKey(c),
    ),
    'model.primaryKeyFieldRefs': new DefinitionDiffReplacementField(
      'primary key fields',
    ),
    'graphql.objectType.enabled': new DefinitionDiffReplacementField(
      'GraphQL object type enabled',
    ),
    'graphql.objectType.fields': new DefinitionDiffArrayIncludesField(
      'GraphQL object type fields',
    ),
    'graphql.objectType.localRelations': new DefinitionDiffArrayIncludesField(
      'GraphQL object type local relations',
    ),
    'graphql.objectType.foreignRelations': new DefinitionDiffArrayIncludesField(
      'GraphQL object type foreign relations',
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
  input: ModelConfigInput,
  definitionContainer: ProjectDefinitionContainer,
  siblingModels: ModelConfigInput[],
): ModelMergerModelInput {
  const siblingModelIds = new Map(siblingModels.map((m) => [m.id, m.name]));
  const siblingModelFieldIdMap = new Map([
    ...input.model.fields.map((f) => [f.id, f.name] as const),
    ...siblingModels.flatMap((m) =>
      m.model.fields.map((f) => [f.id, f.name] as const),
    ),
  ]);
  const siblingModelRelationIdMap = new Map([
    ...(input.model.relations ?? []).map((r) => [r.id, r.name] as const),
    ...siblingModels.flatMap((m) =>
      (m.model.relations ?? []).map((r) => [r.id, r.name] as const),
    ),
    ...(input.model.relations ?? []).map(
      (r) => [r.foreignId, r.foreignRelationName] as const,
    ),
    ...siblingModels.flatMap((m) =>
      (m.model.relations ?? []).map(
        (r) => [r.foreignId, r.foreignRelationName] as const,
      ),
    ),
  ]);
  const modelFromId = (id: string): string =>
    siblingModelIds.get(id) ?? definitionContainer.nameFromId(id);
  const fieldNameFromId = (id: string): string =>
    siblingModelFieldIdMap.get(id) ?? definitionContainer.nameFromId(id);
  const relationNameFromId = (id: string): string =>
    siblingModelRelationIdMap.get(id) ?? definitionContainer.nameFromId(id);
  return {
    ...input,
    model: {
      ...input.model,
      relations: input.model.relations?.map((r) => ({
        ...r,
        modelRef: modelFromId(r.modelRef),
        references: r.references.map((reference) => ({
          ...reference,
          localRef: fieldNameFromId(reference.localRef),
          foreignRef: fieldNameFromId(reference.foreignRef),
        })),
      })),
      uniqueConstraints: input.model.uniqueConstraints?.map((c) => ({
        ...c,
        fields: c.fields.map((f) => ({
          ...f,
          fieldRef: fieldNameFromId(f.fieldRef),
        })),
      })),
      primaryKeyFieldRefs: input.model.primaryKeyFieldRefs.map(fieldNameFromId),
    },
    graphql: {
      ...input.graphql,
      objectType: {
        ...input.graphql?.objectType,
        fields: input.graphql?.objectType?.fields?.map(fieldNameFromId) ?? [],
        localRelations:
          input.graphql?.objectType?.localRelations?.map(relationNameFromId) ??
          [],
        foreignRelations:
          input.graphql?.objectType?.foreignRelations?.map(
            relationNameFromId,
          ) ?? [],
      },
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
  resolveForeignRelationRef: (relationName: string) => string,
  resolveModelRef: (modelRef: string) => string,
): Pick<ModelConfigInput, 'model' | 'graphql'> {
  const inputWithIds = attachIdsToModelMergerModelInput(input);
  const resolveLocalFieldName = (name: string): string => {
    const field = inputWithIds.model.fields.find((f) => f.name === name);
    if (!field) {
      throw new Error(`Field ${name} not found`);
    }
    return field.id;
  };
  const resolveLocalRelationName = (name: string): string => {
    const relation = inputWithIds.model.relations?.find((r) => r.name === name);
    if (!relation) {
      throw new Error(`Relation ${name} not found`);
    }
    return relation.id;
  };
  return {
    ...inputWithIds,
    model: {
      ...inputWithIds.model,
      relations: inputWithIds.model.relations?.map((relation) => ({
        ...relation,
        modelRef: resolveModelRef(relation.modelRef),
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
    graphql: {
      ...inputWithIds.graphql,
      objectType: {
        ...inputWithIds.graphql?.objectType,
        fields:
          inputWithIds.graphql?.objectType?.fields?.map((fieldRef) =>
            resolveLocalFieldName(fieldRef),
          ) ?? [],
        localRelations:
          inputWithIds.graphql?.objectType?.localRelations?.map((relationRef) =>
            resolveLocalRelationName(relationRef),
          ) ?? [],
        foreignRelations:
          inputWithIds.graphql?.objectType?.foreignRelations?.map(
            (relationRef) => resolveForeignRelationRef(relationRef),
          ) ?? [],
      },
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
  id: string,
): ModelConfigInput {
  return {
    id,
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
    current ??
    createNewModelConfigInput(
      desired.name,
      desired.featureRef,
      modelEntityType.generateNewId(),
    );
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

export function doesModelMergerResultsHaveChanges(
  results: Record<
    keyof ModelMergerModelsInput,
    ModelMergerModelDiffResult | undefined
  >,
): boolean {
  return Object.values(results).some((result) => result?.changes);
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
        : ModelUtils.byName(definitionContainer.definition, current[key] ?? ''),
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
        const siblingModel = siblingModels.find(
          (m) => m.id === modelId || m.name === modelId,
        );
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
      (relationName) => {
        // Search sibling model first
        let relationId: string | undefined;
        for (const siblingModel of siblingModels) {
          const relation = siblingModel.model.relations?.find(
            (r) => r.foreignRelationName === relationName,
          );
          if (relation) {
            relationId = relation.foreignId;
            break;
          }
        }

        if (relationId) {
          return relationId;
        }

        const relations = ModelUtils.getRelationsToModel(
          definitionContainer.definition,
          model.id,
        );
        const relation = relations.find(
          (r) =>
            r.relation.foreignRelationName === relationName &&
            r.relation.modelRef === model.id,
        );
        if (!relation) {
          throw new Error(
            `Relation ${relationName} not found in model ${model.name}`,
          );
        }
        return relation.relation.foreignId;
      },
      (modelRef) => {
        const siblingModel = siblingModels.find(
          (m) => m.id === modelRef || m.name === modelRef,
        );
        if (siblingModel) {
          return siblingModel.id;
        }

        return modelRef;
      },
    ),
  };
}

export function applyModelMergerResultInPlace(
  draftConfig: ProjectDefinition,
  currentModel: ModelConfigInput,
  result: ModelMergerModelDiffResult,
  definitionContainer: ProjectDefinitionContainer,
  { siblingModels = [] }: ModelMergerOptions = {},
): string {
  const newModel = applyModelMergerDiff(
    currentModel,
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
  const newModels: ModelConfigInput[] = [];
  const resultIds: Record<keyof T, string> = {} as Record<keyof T, string>;

  // Apply model mergers in order
  for (const [key, result] of Object.entries(results) as [
    keyof T,
    ModelMergerModelDiffResult | undefined,
  ][]) {
    if (result) {
      const model = result.isNewModel
        ? createNewModelConfigInput(result.name, result.featureRef, result.id)
        : ModelUtils.byIdOrThrow(definitionContainer.definition, result.id);
      applyModelMergerResultInPlace(
        draftConfig,
        model,
        result,
        definitionContainer,
        {
          siblingModels: newModels,
        },
      );
      const newModel = draftConfig.models.find((m) => m.id === result.id);
      if (newModel) {
        newModels.push(newModel);
      }
      resultIds[key] = model.id;
    } else {
      resultIds[key] = desired[key].name;
    }
  }
  return resultIds;
}
