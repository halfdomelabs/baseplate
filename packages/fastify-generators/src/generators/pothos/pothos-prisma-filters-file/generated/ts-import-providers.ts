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

import { POTHOS_POTHOS_PRISMA_FILTERS_FILE_PATHS } from './template-paths.js';

export const pothosPrismaFiltersFileImportsSchema = createTsImportMapSchema({
  validateWhereComplexity: {},
});

export type PothosPrismaFiltersFileImportsProvider =
  TsImportMapProviderFromSchema<typeof pothosPrismaFiltersFileImportsSchema>;

export const pothosPrismaFiltersFileImportsProvider =
  createReadOnlyProviderType<PothosPrismaFiltersFileImportsProvider>(
    'pothos-prisma-filters-file-imports',
  );

const pothosPothosPrismaFiltersFileImportsTask = createGeneratorTask({
  dependencies: {
    paths: POTHOS_POTHOS_PRISMA_FILTERS_FILE_PATHS.provider,
  },
  exports: {
    pothosPrismaFiltersFileImports:
      pothosPrismaFiltersFileImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        pothosPrismaFiltersFileImports: createTsImportMap(
          pothosPrismaFiltersFileImportsSchema,
          { validateWhereComplexity: paths.filters },
        ),
      },
    };
  },
});

export const POTHOS_POTHOS_PRISMA_FILTERS_FILE_IMPORTS = {
  generatorName:
    '@baseplate-dev/fastify-generators#pothos/pothos-prisma-filters-file',
  task: pothosPothosPrismaFiltersFileImportsTask,
};
