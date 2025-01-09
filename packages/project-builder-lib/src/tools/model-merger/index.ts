import _ from 'lodash';

import type { ProjectDefinitionContainer } from '@src/definition/project-definition-container.js';
import type {
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
} from '@src/schema/index.js';

import { ModelUtils } from '@src/definition/index.js';
import { modelScalarFieldEntityType } from '@src/schema/index.js';

export interface DiffOperation<TField> {
  type: 'add' | 'update' | 'remove';
  name: string;
  field: TField;
}

export type ModelScalarFieldDefinitionInput = Omit<
  ModelScalarFieldConfig,
  'id'
>;

export type ModelRelationFieldDefinitionInput = Omit<
  ModelRelationFieldConfig,
  'id' | 'foreignId'
>;

export interface ModelDefinitionInput {
  fields: ModelScalarFieldDefinitionInput[];
  primaryKeyFieldRefs: string[];
  relations?: ModelRelationFieldDefinitionInput[];
}

export interface ModelDiffOutput {
  fields: DiffOperation<ModelScalarFieldDefinitionInput>[];
  relations: DiffOperation<ModelRelationFieldDefinitionInput>[];
  primaryKeyFieldRefs?: string[];
}

export interface ModelDiffOptions {
  enableRemove?: boolean;
}

function diffModelFields<T extends { id?: string; name: string }>(
  current: T[],
  desired: T[],
  { enableRemove }: ModelDiffOptions = {},
): DiffOperation<T>[] {
  const operations: DiffOperation<T>[] = [];

  for (const field of desired) {
    const currentField = current.find((f) => f.name === field.name);

    if (!currentField) {
      operations.push({
        type: 'add',
        name: field.name,
        field,
      });
      continue;
    }

    if (!_.isMatch(currentField, field)) {
      operations.push({
        type: 'update',
        name: field.name,
        field,
      });
    }
  }

  if (enableRemove) {
    for (const field of current) {
      if (!desired.some((f) => f.name === field.name)) {
        operations.push({
          type: 'remove',
          name: field.name,
          field,
        });
      }
    }
  }

  return operations;
}

function applyModelFieldsPatch<T extends { id?: string; name: string }>(
  current: T[],
  patch: DiffOperation<T>[],
): T[] {
  const fields = [...current];

  for (const { type, field } of patch) {
    const existingField = fields.find((f) => f.name === field.name);
    switch (type) {
      case 'add': {
        fields.push(field);
        break;
      }
      case 'remove': {
        fields.splice(
          fields.findIndex((f) => f.name === field.name),
          1,
        );
        break;
      }
      case 'update': {
        if (!existingField) {
          throw new Error(`Cannot apply patch. Field ${field.name} not found`);
        }
        fields.splice(
          fields.findIndex((f) => f.name === field.name),
          1,
          {
            ...field,
            id: existingField.id,
          },
        );
        break;
      }
    }
  }

  return fields;
}

export function diffModel(
  current: ModelDefinitionInput,
  desired: ModelDefinitionInput,
  definitionContainer: ProjectDefinitionContainer,
  options?: ModelDiffOptions,
): ModelDiffOutput | undefined {
  // resolve references in relations
  const resolvedRelations =
    current.relations?.map((relation) => ({
      ...relation,
      references: relation.references.map((reference) => ({
        ...reference,
        localRef: definitionContainer.nameFromId(reference.localRef),
        foreignRef: definitionContainer.nameFromId(reference.foreignRef),
      })),
    })) ?? [];
  const diff = {
    fields: diffModelFields(current.fields, desired.fields, options),
    relations: diffModelFields(
      resolvedRelations,
      desired.relations ?? [],
      options,
    ),
    primaryKeyFieldRefs: _.isEqual(
      current.primaryKeyFieldRefs,
      desired.primaryKeyFieldRefs,
    )
      ? undefined
      : desired.primaryKeyFieldRefs,
  };
  return diff.fields.length > 0 || diff.relations.length > 0 ? diff : undefined;
}

export function applyModelPatchInPlace(
  current: ModelDefinitionInput,
  patch: ModelDiffOutput,
  definitionContainer: ProjectDefinitionContainer,
): void {
  const newFields = applyModelFieldsPatch(current.fields, patch.fields);
  // assign IDs to all fields if not present
  const fieldsWithId = newFields.map((field) => ({
    id: modelScalarFieldEntityType.generateNewId(),
    ...field,
  }));
  current.fields = fieldsWithId;

  current.relations = applyModelFieldsPatch(
    current.relations ?? [],
    patch.relations,
  );

  if (patch.primaryKeyFieldRefs) {
    current.primaryKeyFieldRefs = patch.primaryKeyFieldRefs;
  }

  // resolve references in relations
  const resolveLocalName = (name: string): string => {
    const field = fieldsWithId.find((f) => f.name === name);
    if (!field) {
      return name;
    }
    return field.id;
  };
  const resolveForeignName = (name: string, foreignModel: string): string => {
    const field = ModelUtils.byIdOrThrow(
      definitionContainer.definition,
      foreignModel,
    ).model.fields.find((f) => f.name === name);
    if (!field) {
      return name;
    }
    return field.id;
  };
  current.relations = current.relations.map((relation) => ({
    ...relation,
    references: relation.references.map((reference) => ({
      ...reference,
      localRef: resolveLocalName(reference.localRef),
      foreignRef: resolveForeignName(reference.foreignRef, relation.modelName),
    })),
  }));
}
