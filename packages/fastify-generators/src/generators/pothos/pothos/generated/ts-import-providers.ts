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

import { POTHOS_POTHOS_PATHS } from './template-paths.js';

const pothosImportsSchema = createTsImportMapSchema({ builder: {} });

export type PothosImportsProvider = TsImportMapProviderFromSchema<
  typeof pothosImportsSchema
>;

export const pothosImportsProvider =
  createReadOnlyProviderType<PothosImportsProvider>('pothos-imports');

const pothosPothosImportsTask = createGeneratorTask({
  dependencies: {
    paths: POTHOS_POTHOS_PATHS.provider,
  },
  exports: { pothosImports: pothosImportsProvider.export(projectScope) },
  run({ paths }) {
    return {
      providers: {
        pothosImports: createTsImportMap(pothosImportsSchema, {
          builder: paths.builder,
        }),
      },
    };
  },
});

export const POTHOS_POTHOS_IMPORTS = {
  task: pothosPothosImportsTask,
};
