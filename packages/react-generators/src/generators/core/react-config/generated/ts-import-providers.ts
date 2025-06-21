import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { CORE_REACT_CONFIG_PATHS } from './template-paths.js';

const reactConfigImportsSchema = createTsImportMapSchema({ config: {} });

export type ReactConfigImportsProvider = TsImportMapProviderFromSchema<
  typeof reactConfigImportsSchema
>;

export const reactConfigImportsProvider =
  createReadOnlyProviderType<ReactConfigImportsProvider>(
    'react-config-imports',
  );

const coreReactConfigImportsTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REACT_CONFIG_PATHS.provider,
  },
  exports: {
    reactConfigImports: reactConfigImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        reactConfigImports: createTsImportMap(reactConfigImportsSchema, {
          config: paths.config,
        }),
      },
    };
  },
});

export const CORE_REACT_CONFIG_IMPORTS = {
  task: coreReactConfigImportsTask,
};
