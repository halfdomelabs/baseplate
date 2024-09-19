import { omit } from 'es-toolkit';

import { createSchemaMigration } from './types.js';
import { modelUniqueConstraintEntityType } from '../schema/index.js';

interface OldConfig {
  models: {
    model: {
      primaryKeys?: string[];
      fields: {
        name: string;
        isId?: boolean;
        isUnique?: boolean;
      }[];
      uniqueConstraints?: {
        name: string;
        fields: {
          name: string;
        }[];
      }[];
    };
  }[];
}

interface NewConfig {
  models: {
    model: {
      primaryKeyFieldRefs: string[];
      fields: {
        name: string;
      }[];
      uniqueConstraints: {
        id: string;
        fields: {
          fieldRef: string;
        }[];
      }[];
    };
  }[];
}

export const migration005PrimaryUniqueRefs = createSchemaMigration<
  OldConfig,
  NewConfig
>({
  version: 5,
  name: 'primaryUniqueRefs',
  description:
    'Store primary key in primaryKeyFieldRefs field and unique constraints in unique constraints field',
  migrate: (config) => {
    return {
      ...config,
      models: config.models.map((model) => {
        const oldModel = model.model;
        const primaryKeyFieldRefs = oldModel.primaryKeys?.length
          ? oldModel.primaryKeys
          : oldModel.fields.filter((f) => f.isId).map((f) => f.name);
        return {
          ...model,
          model: {
            ...omit(oldModel, ['primaryKeys', 'uniqueConstraints']),
            primaryKeyFieldRefs,
            fields: oldModel.fields.map((f) => omit(f, ['isId', 'isUnique'])),
            uniqueConstraints: [
              ...(oldModel.uniqueConstraints?.map((c) => ({
                id: modelUniqueConstraintEntityType.generateNewId(),
                fields: c.fields.map((f) => ({
                  fieldRef: f.name,
                })),
              })) ?? []),
              ...oldModel.fields
                .filter((f) => f.isUnique)
                .map((f) => ({
                  id: modelUniqueConstraintEntityType.generateNewId(),
                  fields: [{ fieldRef: f.name }],
                })),
            ],
          },
        };
      }),
    };
  },
});
