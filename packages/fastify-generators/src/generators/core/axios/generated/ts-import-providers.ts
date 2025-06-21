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

import { CORE_AXIOS_PATHS } from './template-paths.js';

const axiosImportsSchema = createTsImportMapSchema({ getAxiosErrorInfo: {} });

export type AxiosImportsProvider = TsImportMapProviderFromSchema<
  typeof axiosImportsSchema
>;

export const axiosImportsProvider =
  createReadOnlyProviderType<AxiosImportsProvider>('axios-imports');

const coreAxiosImportsTask = createGeneratorTask({
  dependencies: {
    paths: CORE_AXIOS_PATHS.provider,
  },
  exports: { axiosImports: axiosImportsProvider.export(packageScope) },
  run({ paths }) {
    return {
      providers: {
        axiosImports: createTsImportMap(axiosImportsSchema, {
          getAxiosErrorInfo: paths.axios,
        }),
      },
    };
  },
});

export const CORE_AXIOS_IMPORTS = {
  task: coreAxiosImportsTask,
};
