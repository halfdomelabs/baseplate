import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  projectScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { CORE_CONFIG_SERVICE_PATHS } from './template-paths.js';

const configServiceImportsSchema = createTsImportMapSchema({ config: {} });

export type ConfigServiceImportsProvider = TsImportMapProviderFromSchema<
  typeof configServiceImportsSchema
>;

export const configServiceImportsProvider =
  createReadOnlyProviderType<ConfigServiceImportsProvider>(
    'config-service-imports',
  );

const coreConfigServiceImportsTask = createGeneratorTask({
  dependencies: {
    paths: CORE_CONFIG_SERVICE_PATHS.provider,
  },
  exports: {
    imports: configServiceImportsProvider.export(projectScope),
  },
  run({ paths }) {
    return {
      providers: {
        imports: createTsImportMap(configServiceImportsSchema, {
          config: paths.config,
        }),
      },
    };
  },
});

export const CORE_CONFIG_SERVICE_IMPORTS = {
  task: coreConfigServiceImportsTask,
};
