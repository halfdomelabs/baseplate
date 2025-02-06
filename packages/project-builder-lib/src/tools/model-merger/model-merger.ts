import { isEqual } from 'es-toolkit';

import type { ProjectDefinitionContainer } from '@src/definition/project-definition-container.js';
import type {
  ModelConfig,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
  ModelUniqueConstraintConfig,
} from '@src/schema/index.js';

import { ModelUtils } from '@src/definition/index.js';
import {
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
  modelUniqueConstraintEntityType,
} from '@src/schema/index.js';

/**
 * Diff operation type.
 */
export interface DiffOperation<T> {
  type: 'add' | 'update' | 'remove';
  key: string;
  item: T;
}

export type ModelScalarFieldDefinitionInput = Omit<
  ModelScalarFieldConfig,
  'id'
>;

export type ModelRelationFieldDefinitionInput = Omit<
  ModelRelationFieldConfig,
  'id' | 'foreignId'
>;

export type ModelUniqueConstraintDefinitionInput = Omit<
  ModelUniqueConstraintConfig,
  'id'
>;

/**
 * Input for diffing model definitions.
 */
export interface ModelDefinitionInput {
  fields: ModelScalarFieldDefinitionInput[];
  primaryKeyFieldRefs: string[];
  relations?: ModelRelationFieldDefinitionInput[];
  uniqueConstraints?: ModelUniqueConstraintDefinitionInput[];
}

/**
 * Result of diffing model definitions.
 */
export interface ModelDiffOutput {
  fields: DiffOperation<ModelScalarFieldDefinitionInput>[];
  relations: DiffOperation<ModelRelationFieldDefinitionInput>[];
  uniqueConstraints: DiffOperation<ModelUniqueConstraintDefinitionInput>[];
  primaryKeyFieldRefs?: string[];
}

export interface ModelDiffOptions {
  enableRemove?: boolean;
}

/**
 * Generic diff function using a provided key extractor.
 *
 * @param current - The current array of items.
 * @param desired - The desired array of items.
 * @param getKey - Function that returns a unique key for an item.
 * @param options - Diff options.
 * @returns Array of diff operations.
 */
function diffByKey<T>(
  current: T[],
  desired: T[],
  getKey: (item: T) => string,
  options: ModelDiffOptions = {},
): DiffOperation<T>[] {
  const ops: DiffOperation<T>[] = [];

  for (const desiredItem of desired) {
    const key = getKey(desiredItem);
    const currentItem = current.find((item) => getKey(item) === key);
    if (!currentItem) {
      ops.push({ type: 'add', key, item: desiredItem });
      continue;
    }
    if (!isEqual(currentItem, desiredItem)) {
      ops.push({ type: 'update', key, item: desiredItem });
    }
  }

  if (options.enableRemove) {
    for (const currentItem of current) {
      const key = getKey(currentItem);
      if (!desired.some((item) => getKey(item) === key)) {
        ops.push({ type: 'remove', key, item: currentItem });
      }
    }
  }

  return ops;
}

/**
 * Generic patch applier for items identified by a key.
 *
 * @param current - The current array of items.
 * @param patch - Diff operations to apply.
 * @param getKey - Function that returns a unique key for an item.
 * @param assignId - Optional function to assign an ID for new items.
 * @returns Updated array after applying the patch.
 */
function applyPatchByKey<TConfig, TInput>(
  current: TConfig[],
  patch: DiffOperation<TInput>[],
  getKey: (item: TConfig) => string,
  assignId: (item: TInput, previousItem?: TConfig) => TConfig,
): TConfig[] {
  const items = [...current];
  for (const { type, key, item } of patch) {
    const index = items.findIndex((i) => getKey(i) === key);
    switch (type) {
      case 'add': {
        items.push(assignId(item));
        break;
      }
      case 'update': {
        if (index === -1) {
          throw new Error(
            `Cannot apply patch. Item with key "${key}" not found.`,
          );
        }
        // Preserve existing id if present.
        items[index] = assignId(item, items[index]);
        break;
      }
      case 'remove': {
        if (index !== -1) {
          items.splice(index, 1);
        }
        break;
      }
    }
  }
  return items;
}

/**
 * Computes a unique key for a unique constraint by sorting its field refs.
 *
 * @param constraint - Unique constraint input.
 * @returns A key string.
 */
function getUniqueConstraintKey(
  constraint: ModelUniqueConstraintDefinitionInput,
): string {
  const fields = constraint.fields.map((f) => f.fieldRef).sort();
  return fields.join('|');
}

/**
 * Diff the model definition.
 *
 * @param current - The current model definition.
 * @param desired - The desired model definition.
 * @param definitionContainer - Project definition container.
 * @param options - Diff options.
 * @returns A diff output or undefined if there are no differences.
 */
export function diffModel(
  current: ModelConfig['model'],
  desired: ModelDefinitionInput,
  definitionContainer: ProjectDefinitionContainer,
  options?: ModelDiffOptions,
): ModelDiffOutput | undefined {
  // Resolve relation references.
  const resolvedRelations =
    current.relations?.map((relation) => ({
      ...relation,
      references: relation.references.map((reference) => ({
        ...reference,
        localRef: definitionContainer.nameFromId(reference.localRef),
        foreignRef: definitionContainer.nameFromId(reference.foreignRef),
      })),
    })) ?? [];

  const fieldDiffs = diffByKey(
    current.fields,
    desired.fields,
    (f) => f.name,
    options,
  );
  const relationDiffs = diffByKey(
    resolvedRelations,
    desired.relations ?? [],
    (r) => r.name,
    options,
  );
  const uniqueConstraintDiffs = diffByKey(
    current.uniqueConstraints ?? [],
    desired.uniqueConstraints ?? [],
    getUniqueConstraintKey,
    options,
  );

  const pkDiff = isEqual(
    current.primaryKeyFieldRefs,
    desired.primaryKeyFieldRefs,
  )
    ? undefined
    : desired.primaryKeyFieldRefs;

  if (
    fieldDiffs.length > 0 ||
    relationDiffs.length > 0 ||
    uniqueConstraintDiffs.length > 0 ||
    pkDiff
  ) {
    return {
      fields: fieldDiffs,
      relations: relationDiffs,
      uniqueConstraints: uniqueConstraintDiffs,
      primaryKeyFieldRefs: pkDiff,
    };
  }
  return undefined;
}

/**
 * Applies the diff patch to the current model definition.
 *
 * @param current - The current model definition.
 * @param patch - The diff patch.
 * @param definitionContainer - Project definition container.
 */
export function applyModelPatchInPlace(
  current: ModelConfig['model'],
  patch: ModelDiffOutput,
  definitionContainer: ProjectDefinitionContainer,
): void {
  // Patch fields.
  current.fields = applyPatchByKey(
    current.fields,
    patch.fields,
    (f) => f.name,
    (field, previousField) => ({
      ...field,
      id: previousField?.id ?? modelScalarFieldEntityType.generateNewId(),
    }),
  );

  // Patch relations.
  current.relations = applyPatchByKey(
    current.relations ?? [],
    patch.relations,
    (r) => r.name,
    (relation, previousRelation) => ({
      ...relation,
      id: previousRelation?.id ?? modelLocalRelationEntityType.generateNewId(),
      foreignId:
        previousRelation?.foreignId ??
        modelForeignRelationEntityType.generateNewId(),
    }),
  );

  // Patch unique constraints.
  current.uniqueConstraints = applyPatchByKey(
    current.uniqueConstraints ?? [],
    patch.uniqueConstraints,
    getUniqueConstraintKey,
    (constraint, previousConstraint) => ({
      ...constraint,
      id:
        previousConstraint?.id ??
        modelUniqueConstraintEntityType.generateNewId(),
    }),
  );

  if (patch.primaryKeyFieldRefs) {
    current.primaryKeyFieldRefs = patch.primaryKeyFieldRefs;
  }

  // Resolve relation references.
  const resolveLocalId = (name: string): string => {
    const field = current.fields.find((f) => f.name === name);
    return field ? field.id : name;
  };
  const resolveForeignId = (name: string, foreignModel: string): string => {
    const field = ModelUtils.byIdOrThrow(
      definitionContainer.definition,
      foreignModel,
    ).model.fields.find((f) => f.name === name);
    return field ? field.id : name;
  };

  current.relations = current.relations.map((relation) => ({
    ...relation,
    references: relation.references.map((reference) => ({
      ...reference,
      localRef: resolveLocalId(reference.localRef),
      foreignRef: resolveForeignId(reference.foreignRef, relation.modelRef),
    })),
  }));
}
