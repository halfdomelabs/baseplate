import R from 'ramda';
import {
  AppConfig,
  APP_CONFIG_REFERENCEABLES,
  APP_CONFIG_REFERENCES,
  appConfigSchema,
} from '@src/schema';
import {
  findReferencableEntries,
  findReferenceEntries,
  ObjectReferenceEntry,
} from '@src/schema/references';
import { deepMergeRightUniq, safeMerge } from '@src/utils/merge';
import { randomUid } from '../utils/randomUid';
import { AuthPlugin } from './plugins/auth';
import { ParsedModel } from './types';

const PARSER_PLUGINS = [AuthPlugin];

function upsertItems<T>(
  items: T[] | undefined,
  existingItems: T[] | undefined,
  keyFunction: (item: T) => string
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

function validateAppConfig(appConfig: AppConfig): void {
  const features = appConfig.features?.map((f) => f.name) || [];

  // validate features
  const missingParentFeatures = features.filter(
    (feature) =>
      feature.includes('/') &&
      !features.includes(feature.substring(0, feature.lastIndexOf('/')))
  );

  if (missingParentFeatures.length) {
    throw new Error(
      `Nested features must be a direct child of another feature. Features with missing parents: ${missingParentFeatures.join(
        ', '
      )}`
    );
  }

  // apply some basic validation rules to app config
  // const featurelessModels = (appConfig.models || []).filter(
  //   (model) => !features.includes(model.feature)
  // );
  // if (featurelessModels.length) {
  //   throw new Error(
  //     `Models must be associated with a feature: ${featurelessModels
  //       .map((model) => model.name)
  //       .join(', ')}`
  //   );
  // }
}

function buildReferenceMap(
  appConfig: AppConfig
): Record<string, Record<string, ObjectReferenceEntry[]>> {
  const categories = APP_CONFIG_REFERENCEABLES.map((r) => r.category);
  const referencesByKey = categories.map((category) => {
    const references = APP_CONFIG_REFERENCES.filter(
      (r) => r.category === category
    );
    const referenceEntries = references.flatMap((reference) =>
      findReferenceEntries(appConfig, reference)
    );
    return R.groupBy(R.prop('key'), referenceEntries);
  });
  return R.zipObj(categories, referencesByKey);
}

function findMissingReferences(
  appConfig: AppConfig,
  referenceMap: Record<string, Record<string, ObjectReferenceEntry[]>>
): ObjectReferenceEntry[] {
  return APP_CONFIG_REFERENCEABLES.flatMap((referenceable) => {
    const availableKeys = findReferencableEntries(appConfig, referenceable).map(
      R.prop('key')
    );
    const referencesByKey = referenceMap[referenceable.category];
    // make sure keys exist in referenceables
    const missingKeys = R.difference(
      Object.keys(referencesByKey),
      availableKeys
    );
    return missingKeys.flatMap((key) => referencesByKey[key]);
  });
}

export class ParsedAppConfig {
  protected models: ParsedModel[];

  public globalHoistedProviders: string[] = [];

  public featureHoistedProviders: Record<string, string[]> = {};

  public fastifyChildren: Record<string, unknown> = {};

  public featureChildren: Record<string, Record<string, unknown>> = {};

  public references: Record<string, Record<string, ObjectReferenceEntry[]>> =
    {};

  constructor(public appConfig: AppConfig) {
    validateAppConfig(appConfig);
    const copiedAppConfig = R.clone(appConfig);
    this.models = copiedAppConfig.models || [];

    // run plugins
    PARSER_PLUGINS.forEach((plugin) =>
      plugin.run(appConfig, {
        addGlobalHoistedProviders: (providers) => {
          this.globalHoistedProviders = [
            ...this.globalHoistedProviders,
            ...(Array.isArray(providers) ? providers : [providers]),
          ];
        },
        addFeatureHoistedProviders: (featurePath, providers) => {
          this.featureHoistedProviders[featurePath] = [
            ...(this.featureHoistedProviders[featurePath] || []),
            ...(Array.isArray(providers) ? providers : [providers]),
          ];
        },
        addFastifyChildren: (children) => {
          this.fastifyChildren = safeMerge(this.fastifyChildren, children);
        },
        addFeatureChildren: (featurePath, children) => {
          this.featureChildren[featurePath] = safeMerge(
            this.featureChildren[featurePath],
            children
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
              `Model ${model.name} has conflicting feature paths in ${plugin.name}`
            );
          }

          // upsert model fields into existing model
          Object.assign(existingModel, {
            model: {
              ...existingModel.model,
              fields: upsertItems(
                model.model.fields,
                existingModel.model.fields,
                (i) => i.name
              ),
              relations: upsertItems(
                model.model.relations,
                existingModel.model.relations,
                (i) => i.name
              ),
            },
            service: deepMergeRightUniq(existingModel.service, model.service),
          });
        },
      })
    );

    // augment app config
    const updatedAppConfig = {
      ...this.appConfig,
      models: this.models,
    };
    this.appConfig = updatedAppConfig;

    // build reference map
    this.references = buildReferenceMap(updatedAppConfig);
    const missingKeys = findMissingReferences(
      updatedAppConfig,
      this.references
    );
    if (missingKeys.length) {
      throw new Error(
        `Missing keys in references: ${missingKeys
          .map((key) => `${key.key} (${key.path})`)
          .join(', ')}`
      );
    }
  }

  getFeatureHoistedProviders(featurePath: string): string[] {
    return this.featureHoistedProviders[featurePath];
  }

  getFeatureChildren(featurePath: string): Record<string, unknown> {
    return this.featureChildren[featurePath];
  }

  getModels(): ParsedModel[] {
    return this.models;
  }

  getModelByName(name: string): ParsedModel {
    const model = this.models.find((m) => m.name === name);
    if (!model) {
      throw new Error(`Model ${name} not found`);
    }
    return model;
  }

  exportToAppConfig(): AppConfig {
    return appConfigSchema.validateSync(this.appConfig);
  }
}
