import { omit } from 'es-toolkit';

import { createSchemaMigration } from './types.js';

interface OldConfig {
  models: {
    id: string;
    service?: {
      build?: boolean;
      create?: {
        fields?: string[];
        transformerNames?: string[];
      };
      update?: {
        fields?: string[];
        transformerNames?: string[];
      };
      delete?: {
        disabled?: boolean;
      };
    };
  }[];
}

interface NewConfig {
  models: {
    id: string;
    service?: {
      create?: {
        enabled: boolean;
        fields?: string[];
        transformerNames?: string[];
      };
      update?: {
        enabled: boolean;
        fields?: string[];
        transformerNames?: string[];
      };
      delete?: {
        enabled: boolean;
      };
    };
  }[];
}

export const migration006IndividualServiceControllers = createSchemaMigration<
  OldConfig,
  NewConfig
>({
  version: 6,
  name: 'individualServiceControllers',
  description: 'Make service controller fields individually enabled',
  migrate: (config) => ({
    ...config,
    models: config.models.map((model) => {
      const {
        build,
        create,
        update,
        delete: deleteOp,
        ...rest
      } = model.service ?? {};

      if (!build) {
        return omit(model, ['service']);
      }

      const isCreateEnabled =
        create &&
        (!!create.fields?.length || !!create.transformerNames?.length);
      const isUpdateEnabled =
        update &&
        (!!update.fields?.length || !!update.transformerNames?.length);
      const isDeleteEnabled = !deleteOp?.disabled;

      return {
        ...model,
        service: {
          ...rest,
          create: isCreateEnabled ? { ...create, enabled: true } : undefined,
          update: isUpdateEnabled ? { ...update, enabled: true } : undefined,
          delete: isDeleteEnabled ? { enabled: true } : undefined,
        },
      };
    }),
  }),
});
