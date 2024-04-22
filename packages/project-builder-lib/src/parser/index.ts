import * as R from 'ramda';

import { AuthPlugin } from './plugins/auth.js';
import { Auth0Plugin } from './plugins/auth0.js';
import { StoragePlugin } from './plugins/storage.js';
import { ParsedModel, ParsedRelationField } from './types.js';
import { ProjectDefinitionContainer } from '@src/index.js';
import {
  ProjectDefinition,
  modelEntityType,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from '@src/schema/index.js';
import { EnumConfig } from '@src/schema/models/enums.js';
import { deepMergeRightUniq, safeMerge } from '@src/utils/merge.js';

const PARSER_PLUGINS = [AuthPlugin, Auth0Plugin, StoragePlugin];

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
  const existingKeys = existingItems.map(keyFunction);

  const newItems = items.filter(
    (item) => !existingKeys.includes(keyFunction(item)),
  );
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
  const features = projectDefinition.features?.map((f) => f.name) ?? [];

  // validate features
  const missingParentFeatures = features.filter(
    (feature) =>
      feature.includes('/') &&
      !features.includes(feature.substring(0, feature.lastIndexOf('/'))),
  );

  if (missingParentFeatures.length) {
    throw new Error(
      `Nested features must be a direct child of another feature. Features with missing parents: ${missingParentFeatures.join(
        ', ',
      )}`,
    );
  }

  // validate relations
  const { models = [] } = projectDefinition;
  models.forEach(
    (model) =>
      model.model.relations?.forEach((relation) => {
        const foreignModel = models.find((m) => m.id === relation.modelName);
        if (!foreignModel) {
          throw new Error(
            `Model ${model.name} has a relation to ${relation.modelName} but that model does not exist`,
          );
        }
        // verify types of fields match
        relation.references.forEach((reference) => {
          const foreignField = foreignModel.model.fields.find(
            (f) => f.id === reference.foreign,
          );
          if (!foreignField) {
            throw new Error(
              `Could not find ${reference.foreign} on ${foreignModel.name}`,
            );
          }
          const localField = model.model.fields.find(
            (f) => f.id === reference.local,
          );
          if (!localField) {
            throw new Error(
              `Could not find ${reference.local} on ${model.name}`,
            );
          }
          if (foreignField.type !== localField.type) {
            throw new Error(
              `Field types do not match for ${reference.local} on ${model.name} and ${reference.foreign} on ${foreignModel.name}`,
            );
          }
        });
      }) ?? [],
  );
}

export class ParsedProjectDefinition {
  protected models: ParsedModel[];

  public projectDefinition: ProjectDefinition;

  public globalHoistedProviders: string[] = [];

  public featureHoistedProviders: Record<string, string[]> = {};

  public fastifyChildren: Record<string, unknown> = {};

  public featureChildren: Record<string, Record<string, unknown>> = {};

  constructor(public definitionContainer: ProjectDefinitionContainer) {
    const projectDefinition = definitionContainer.definition;
    this.projectDefinition = projectDefinition;
    validateProjectDefinition(projectDefinition);
    const copiedProjectDefinition = R.clone(projectDefinition);
    this.models = copiedProjectDefinition.models ?? [];

    // run plugins
    PARSER_PLUGINS.forEach((plugin) =>
      plugin.run(
        projectDefinition,
        {
          addGlobalHoistedProviders: (providers) => {
            this.globalHoistedProviders = [
              ...this.globalHoistedProviders,
              ...(Array.isArray(providers) ? providers : [providers]),
            ];
          },
          addFeatureHoistedProviders: (featureId, providers) => {
            this.featureHoistedProviders[featureId] = [
              ...(this.featureHoistedProviders[featureId] ?? []),
              ...(Array.isArray(providers) ? providers : [providers]),
            ];
          },
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
            if (existingModel.feature !== model.feature) {
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
            existingModel.model.relations?.forEach((relation) => {
              relation.references = relation.references.map((reference) => {
                const foreignModel = this.getModelById(relation.modelName);
                const foreignField =
                  foreignModel.model.fields.find(
                    (f) => f.name === reference.foreign,
                  )?.id ?? reference.foreign;
                const localField =
                  existingModel.model.fields.find(
                    (f) => f.name === reference.local,
                  )?.id ?? reference.local;
                return {
                  ...reference,
                  foreign: foreignField,
                  local: localField,
                };
              });
            });

            existingModel.model.primaryKeys =
              existingModel.model.primaryKeys?.map(
                (key) =>
                  existingModel.model.fields.find((f) => f.name === key)?.id ??
                  key,
              );
          },
        },
        definitionContainer,
      ),
    );

    // augment project config
    const updatedProjectDefinition = {
      ...this.projectDefinition,
      models: this.models,
    };
    this.projectDefinition = updatedProjectDefinition;
  }

  getFeatureHoistedProviders(featureId: string): string[] {
    return this.featureHoistedProviders[featureId];
  }

  getFeatureChildren(featureId: string): Record<string, unknown> {
    return this.featureChildren[featureId];
  }

  getModelForeignRelations(
    modelName: string,
  ): { relation: ParsedRelationField; model: ParsedModel }[] {
    return this.models.flatMap(
      (m) =>
        m.model.relations
          ?.filter((relation) => relation.modelName === modelName)
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

  getModelPrimaryKeys(modelId: string): string[] {
    const model = this.getModelById(modelId);
    return model.model.primaryKeys?.length
      ? model.model.primaryKeys
      : model.model.fields.filter((f) => f.isId).map((f) => f.name) ?? [];
  }

  exportToProjectDefinition(): ProjectDefinition {
    return this.projectDefinition;
  }
}
