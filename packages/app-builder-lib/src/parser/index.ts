import R from 'ramda';
import { AppConfig } from '@src/schema';
import { safeMerge } from '@src/utils/merge';
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

  const newItems = items.filter(
    (item) => !existingKeys.includes(keyFunction(item))
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

export class ParsedAppConfig {
  protected models: ParsedModel[];

  public globalHoistedProviders: string[] = [];

  public featureHoistedProviders: Record<string, string[]> = {};

  public fastifyChildren: Record<string, unknown> = {};

  public featureChildren: Record<string, Record<string, unknown>> = {};

  constructor(public appConfig: AppConfig) {
    this.models = appConfig.models || [];

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
            this.models.push(model);
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
            service: {
              ...existingModel.service,
              ...model.service,
            },
          });
        },
      })
    );
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
}
