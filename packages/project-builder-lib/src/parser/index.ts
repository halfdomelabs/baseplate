import * as R from 'ramda';

import { AuthPlugin } from './plugins/auth.js';
import { Auth0Plugin } from './plugins/auth0.js';
import { StoragePlugin } from './plugins/storage.js';
import { ParsedModel, ParsedModelField, ParsedRelationField } from './types.js';
import { randomUid } from '../utils/randomUid.js';
import { serializeSchema } from '@src/index.js';
import {
  AppConfig,
  ProjectConfig,
  projectConfigSchema,
  getProjectConfigReferences,
} from '@src/schema/index.js';
import { EnumConfig } from '@src/schema/models/enums.js';
import {
  REFERENCEABLE_CATEGORIES,
  ObjectReferenceEntry,
  GetReferencesResult,
} from '@src/schema/references.js';
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

  const newItems = items
    .filter((item) => !existingKeys.includes(keyFunction(item)))
    .map((item) => ({
      ...item,
      uid: randomUid(),
    }));
  return [
    ...existingItems.map((item) => {
      const newItem = itemsByKey[keyFunction(item)];
      if (newItem) {
        return { uid: randomUid(), ...item, ...newItem };
      }
      return item;
    }),
    ...newItems,
  ];
}

function validateProjectConfig(projectConfig: ProjectConfig): void {
  const features = projectConfig.features?.map((f) => f.name) ?? [];

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
  const { models = [] } = projectConfig;
  models.forEach(
    (model) =>
      model.model.relations?.forEach((relation) => {
        const foreignModel = models.find((m) => m.name === relation.modelName);
        if (!foreignModel) {
          throw new Error(
            `Model ${model.name} has a relation to ${relation.modelName} but that model does not exist`,
          );
        }
        // verify types of fields match
        relation.references.forEach((reference) => {
          const foreignField = foreignModel.model.fields.find(
            (f) => f.name === reference.foreign,
          );
          if (!foreignField) {
            throw new Error(
              `Could not find ${reference.foreign} on ${foreignModel.name}`,
            );
          }
          const localField = model.model.fields.find(
            (f) => f.name === reference.local,
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

function buildReferenceMap({
  references,
}: GetReferencesResult): Record<
  string,
  Record<string, ObjectReferenceEntry[]>
> {
  const referencesByKey = REFERENCEABLE_CATEGORIES.map((category) => {
    const referenceEntries = references.filter((r) => r.category === category);
    return R.groupBy(R.prop('key'), referenceEntries) as Record<
      string,
      ObjectReferenceEntry[]
    >;
  });
  return R.zipObj(REFERENCEABLE_CATEGORIES, referencesByKey);
}

function findMissingReferences(
  { referenceables }: GetReferencesResult,
  referenceMap: Record<string, Record<string, ObjectReferenceEntry[]>>,
): ObjectReferenceEntry[] {
  return REFERENCEABLE_CATEGORIES.flatMap((category) => {
    const availableKeys = referenceables.map(R.prop('key'));
    const referencesByKey = referenceMap[category];
    // make sure keys exist in referenceables
    const missingKeys = R.difference(
      Object.keys(referencesByKey),
      availableKeys,
    );
    return missingKeys.flatMap((key) => referencesByKey[key]);
  });
}

export class ParsedProjectConfig {
  protected models: ParsedModel[];

  public globalHoistedProviders: string[] = [];

  public featureHoistedProviders: Record<string, string[]> = {};

  public fastifyChildren: Record<string, unknown> = {};

  public featureChildren: Record<string, Record<string, unknown>> = {};

  public references: Record<string, Record<string, ObjectReferenceEntry[]>> =
    {};

  constructor(public projectConfig: ProjectConfig) {
    validateProjectConfig(projectConfig);
    const copiedProjectConfig = R.clone(projectConfig);
    this.models = copiedProjectConfig.models ?? [];

    // run plugins
    PARSER_PLUGINS.forEach((plugin) =>
      plugin.run(projectConfig, {
        addGlobalHoistedProviders: (providers) => {
          this.globalHoistedProviders = [
            ...this.globalHoistedProviders,
            ...(Array.isArray(providers) ? providers : [providers]),
          ];
        },
        addFeatureHoistedProviders: (featurePath, providers) => {
          this.featureHoistedProviders[featurePath] = [
            ...(this.featureHoistedProviders[featurePath] ?? []),
            ...(Array.isArray(providers) ? providers : [providers]),
          ];
        },
        addFastifyChildren: (children) => {
          this.fastifyChildren = safeMerge(this.fastifyChildren, children);
        },
        addFeatureChildren: (featurePath, children) => {
          this.featureChildren[featurePath] = safeMerge(
            this.featureChildren[featurePath],
            children,
          );
        },
        mergeModel: (model) => {
          // look for model if present
          const existingModel = this.models.find((m) => m.name === model.name);

          if (!existingModel) {
            this.models.push({
              uid: randomUid(),
              ...model,
              model: {
                ...model.model,
                fields: model.model.fields.map((field) => ({
                  ...field,
                  uid: randomUid(),
                })),
                relations: model.model.relations?.map((relation) => ({
                  ...relation,
                  uid: randomUid(),
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
        },
      }),
    );

    // augment project config
    const updatedProjectConfig = {
      ...this.projectConfig,
      models: this.models,
    };
    this.projectConfig = updatedProjectConfig;

    // build reference map
    const referenceResult = getProjectConfigReferences(updatedProjectConfig);
    this.references = buildReferenceMap(referenceResult);
    const missingKeys = findMissingReferences(referenceResult, this.references);
    if (missingKeys.length) {
      throw new Error(
        `Missing keys in references: ${missingKeys
          .map((key) => `${key.key} (${key.path})`)
          .join(', ')}`,
      );
    }
  }

  getFeatureHoistedProviders(featurePath: string): string[] {
    return this.featureHoistedProviders[featurePath];
  }

  getFeatureChildren(featurePath: string): Record<string, unknown> {
    return this.featureChildren[featurePath];
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
    return this.projectConfig.enums ?? [];
  }

  getModelByName(name: string): ParsedModel {
    const model = this.models.find((m) => m.name === name);
    if (!model) {
      throw new Error(`Model ${name} not found`);
    }
    return model;
  }

  getModelPrimaryKeys(modelName: string): string[] {
    const model = this.getModelByName(modelName);
    return model.model.primaryKeys?.length
      ? model.model.primaryKeys
      : model.model.fields.filter((f) => f.isId).map((f) => f.name) ?? [];
  }

  exportToProjectConfig(): ProjectConfig {
    return serializeSchema(projectConfigSchema, this.projectConfig);
  }

  getAppByUid(uid: string): AppConfig | undefined {
    return this.projectConfig.apps?.find((app) => app.uid === uid);
  }

  getModelFieldValidation(
    modelName: string,
    fieldName: string,
    preProcess?: boolean,
  ): string {
    const model = this.getModelByName(modelName);
    const field = model.model.fields.find((f) => f.name === fieldName);
    if (!field) {
      throw new Error(`Field ${fieldName} not found in model ${modelName}`);
    }

    const nullishSuffix = field.isOptional ? '.nullish()' : '';

    if (field.type === 'int') {
      return `z.number().or(z.string()).pipe(z.coerce.number().finite().int())${nullishSuffix}`;
    }
    if (field.type === 'float') {
      return `z.number().or(z.string()).pipe(z.coerce.number().finite())${nullishSuffix}`;
    }

    function getModelValidator(modelField: ParsedModelField): string {
      switch (modelField.type) {
        case 'boolean':
          return 'boolean()';
        case 'date':
          return 'string()';
        case 'int':
        case 'float':
          return 'number()';
        case 'dateTime':
        case 'string':
        case 'decimal':
        case 'uuid':
          return 'string()';
        default:
          throw new Error(`Unsupported validator for ${modelField.type}`);
      }
    }

    const validator = `z.${getModelValidator(field)}${nullishSuffix}`;
    if (!preProcess) {
      return validator;
    }
    return validator;
  }
}
