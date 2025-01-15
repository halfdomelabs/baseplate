import type { GeneratorBundleChildren } from '@halfdomelabs/sync';

import * as R from 'ramda';

import type { ProjectDefinitionContainer } from '@src/index.js';
import type { ProjectDefinition } from '@src/schema/index.js';
import type { EnumConfig } from '@src/schema/models/enums.js';

import {
  modelEntityType,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from '@src/schema/index.js';
import { deepMergeRightUniq, safeMerge } from '@src/utils/merge.js';

import type { ParsedModel, ParsedRelationField } from './types.js';

import { Auth0Plugin } from './plugins/auth0.js';

export * from './parser.js';

const PARSER_PLUGINS = [Auth0Plugin];

function upsertItems<T>(
  items: T[] | undefined,
  existingItems: T[] | undefined,
  keyFunction: (item: T) => string,
): T[] {
  if (!items || !existingItems) {
    if (items) {
      return items;
    }
    if (existingItems) {
      return existingItems;
    }
    return [];
  }
  const itemsByKey = R.indexBy(keyFunction, items);
  const existingKeys = new Set(existingItems.map(keyFunction));

  const newItems = items.filter((item) => !existingKeys.has(keyFunction(item)));
  return [
    ...existingItems.map((item) => {
      const newItem = itemsByKey[keyFunction(item)];
      if (newItem) {
        return { ...item, ...newItem };
      }
      return item;
    }),
    ...newItems,
  ];
}

function validateProjectDefinition(projectDefinition: ProjectDefinition): void {
  const features = projectDefinition.features.map((f) => f.name);

  // validate features
  const missingParentFeatures = features.filter(
    (feature) =>
      feature.includes('/') &&
      !features.includes(
        feature.slice(0, Math.max(0, feature.lastIndexOf('/'))),
      ),
  );

  if (missingParentFeatures.length > 0) {
    throw new Error(
      `Nested features must be a direct child of another feature. Features with missing parents: ${missingParentFeatures.join(
        ', ',
      )}`,
    );
  }

  // validate relations
  const { models = [] } = projectDefinition;
  for (const model of models)
    if (model.model.relations) {
      for (const relation of model.model.relations) {
        const foreignModel = models.find((m) => m.id === relation.modelRef);
        if (!foreignModel) {
          throw new Error(
            `Model ${model.name} has a relation to ${relation.modelRef} but that model does not exist`,
          );
        }
        // verify types of fields match
        for (const reference of relation.references) {
          const foreignField = foreignModel.model.fields.find(
            (f) => f.id === reference.foreignRef,
          );
          if (!foreignField) {
            throw new Error(
              `Could not find ${reference.foreignRef} on ${foreignModel.name}`,
            );
          }
          const localField = model.model.fields.find(
            (f) => f.id === reference.localRef,
          );
          if (!localField) {
            throw new Error(
              `Could not find ${reference.localRef} on ${model.name}`,
            );
          }
          if (foreignField.type !== localField.type) {
            throw new Error(
              `Field types do not match for ${reference.localRef} on ${model.name} and ${reference.foreignRef} on ${foreignModel.name}`,
            );
          }
        }
      }
    }
}

export class ParsedProjectDefinition {
  protected models: ParsedModel[];

  public projectDefinition: ProjectDefinition;

  public fastifyChildren: GeneratorBundleChildren = {};

  public featureChildren: Record<string, GeneratorBundleChildren> = {};

  constructor(public definitionContainer: ProjectDefinitionContainer) {
    const projectDefinition = definitionContainer.definition;
    this.projectDefinition = projectDefinition;
    validateProjectDefinition(projectDefinition);
    const copiedProjectDefinition = R.clone(projectDefinition);
    this.models = copiedProjectDefinition.models;

    // run plugins
    for (const plugin of PARSER_PLUGINS)
      plugin.run(
        projectDefinition,
        {
          addFastifyChildren: (children) => {
            this.fastifyChildren = safeMerge(this.fastifyChildren, children);
          },
          addFeatureChildren: (featureId, children) => {
            this.featureChildren[featureId] = safeMerge(
              this.featureChildren[featureId],
              children,
            );
          },
          mergeModel: (model) => {
            // look for model if present
            const existingModel = this.models.find(
              (m) => m.name === model.name,
            );

            if (!existingModel) {
              this.models.push({
                id: modelEntityType.generateNewId(),
                ...model,
                model: {
                  ...model.model,
                  fields: model.model.fields.map((field) => ({
                    ...field,
                    id: modelScalarFieldEntityType.generateNewId(),
                  })),
                  relations: model.model.relations?.map((relation) => ({
                    ...relation,
                    id: modelLocalRelationEntityType.generateNewId(),
                    foreignId: modelForeignRelationEntityType.generateNewId(),
                  })),
                },
              });
              return;
            }

            // merge model in
            if (existingModel.featureRef !== model.featureRef) {
              throw new Error(
                `Model ${model.name} has conflicting feature paths in ${plugin.name}`,
              );
            }

            // upsert model fields into existing model
            Object.assign(existingModel, {
              model: {
                ...existingModel.model,
                fields: upsertItems(
                  model.model.fields,
                  existingModel.model.fields,
                  (i) => i.name,
                ),
                relations: upsertItems(
                  model.model.relations,
                  existingModel.model.relations,
                  (i) => i.name,
                ),
              },
              service: deepMergeRightUniq(existingModel.service, model.service),
            });

            // re-resolve references
            if (existingModel.model.relations)
              for (const relation of existingModel.model.relations) {
                relation.references = relation.references.map((reference) => {
                  const foreignModel = this.getModelById(relation.modelRef);
                  const foreignField =
                    foreignModel.model.fields.find(
                      (f) => f.name === reference.foreignRef,
                    )?.id ?? reference.foreignRef;
                  const localField =
                    existingModel.model.fields.find(
                      (f) => f.name === reference.localRef,
                    )?.id ?? reference.localRef;
                  return {
                    ...reference,
                    foreignRef: foreignField,
                    localRef: localField,
                  };
                });
              }

            existingModel.model.primaryKeyFieldRefs =
              existingModel.model.primaryKeyFieldRefs.map(
                (key) =>
                  existingModel.model.fields.find((f) => f.name === key)?.id ??
                  key,
              );
          },
        },
        definitionContainer,
      );

    // augment project config
    const updatedProjectDefinition = {
      ...this.projectDefinition,
      models: this.models,
    };
    this.projectDefinition = updatedProjectDefinition;
  }

  getFeatureChildren(featureId: string): GeneratorBundleChildren {
    return this.featureChildren[featureId] ?? {};
  }

  getModelForeignRelations(
    modelName: string,
  ): { relation: ParsedRelationField; model: ParsedModel }[] {
    return this.models.flatMap(
      (m) =>
        m.model.relations
          ?.filter((relation) => relation.modelRef === modelName)
          .map((relation) => ({ relation, model: m })) ?? [],
    );
  }

  getModels(): ParsedModel[] {
    return this.models;
  }

  getEnums(): EnumConfig[] {
    return this.projectDefinition.enums ?? [];
  }

  getModelById(id: string): ParsedModel {
    const model = this.models.find((m) => m.id === id);
    if (!model) {
      throw new Error(`Model ${id} not found`);
    }
    return model;
  }

  getModelByName(name: string): ParsedModel {
    const model = this.models.find((m) => m.name === name);
    if (!model) {
      throw new Error(`Model ${name} not found`);
    }
    return model;
  }

  exportToProjectDefinition(): ProjectDefinition {
    return this.projectDefinition;
  }
}
