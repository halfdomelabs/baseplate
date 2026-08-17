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

import { POTHOS_POTHOS_SORT_ORDER_PATHS } from './template-paths.js';

export const pothosSortOrderImportsSchema = createTsImportMapSchema({
  applyStableOrderBy: {},
  sortOrderEnum: {},
});

export type PothosSortOrderImportsProvider = TsImportMapProviderFromSchema<
  typeof pothosSortOrderImportsSchema
>;

export const pothosSortOrderImportsProvider =
  createReadOnlyProviderType<PothosSortOrderImportsProvider>(
    'pothos-sort-order-imports',
  );

const pothosPothosSortOrderImportsTask = createGeneratorTask({
  dependencies: {
    paths: POTHOS_POTHOS_SORT_ORDER_PATHS.provider,
  },
  exports: {
    pothosSortOrderImports: pothosSortOrderImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        pothosSortOrderImports: createTsImportMap(
          pothosSortOrderImportsSchema,
          {
            applyStableOrderBy: paths.sortOrder,
            sortOrderEnum: paths.sortOrder,
          },
        ),
      },
    };
  },
});

export const POTHOS_POTHOS_SORT_ORDER_IMPORTS = {
  generatorName: '@baseplate-dev/fastify-generators#pothos/pothos-sort-order',
  task: pothosPothosSortOrderImportsTask,
};
