import { createSchemaMigration } from './types.js';

interface UuidFieldOptions {
  genUuid?: boolean;
  default?: string;
  defaultGeneration?: 'none' | 'uuidv4' | 'uuidv7';
}

interface ScalarField {
  type: string;
  options?: UuidFieldOptions;
  [key: string]: unknown;
}

interface Model {
  model?: {
    fields?: ScalarField[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface OldConfig {
  models?: Model[];
  [key: string]: unknown;
}

function migrateUuidField(field: ScalarField): ScalarField {
  if (field.type !== 'uuid' || !field.options) {
    return field;
  }

  const { genUuid, default: _default, ...restOptions } = field.options;

  return {
    ...field,
    options: {
      ...restOptions,
      defaultGeneration: genUuid ? 'uuidv4' : 'none',
    },
  };
}

export const migration031UuidDefaultGeneration = createSchemaMigration<
  OldConfig,
  OldConfig
>({
  version: 31,
  name: 'uuidDefaultGeneration',
  description:
    'Replace genUuid boolean with defaultGeneration enum (none | uuidv4 | uuidv7) on UUID fields',
  migrate: (config) => {
    if (!config.models) {
      return config;
    }

    return {
      ...config,
      models: config.models.map((model) => {
        if (!model.model?.fields) {
          return model;
        }

        return {
          ...model,
          model: {
            ...model.model,
            fields: model.model.fields.map(migrateUuidField),
          },
        };
      }),
    };
  },
});
