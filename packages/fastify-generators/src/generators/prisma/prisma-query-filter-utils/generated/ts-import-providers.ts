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

import { PRISMA_PRISMA_QUERY_FILTER_UTILS_PATHS } from './template-paths.js';

export const prismaQueryFilterUtilsImportsSchema = createTsImportMapSchema({
  createModelQueryFilter: {},
  ModelQueryFilter: { isTypeOnly: true },
  ModelQueryFilterConfig: { isTypeOnly: true },
  QueryFilterBuildWhereOptions: { isTypeOnly: true },
  QueryFilterRole: { isTypeOnly: true },
  queryHelpers: {},
  WhereResult: { isTypeOnly: true },
});

export type PrismaQueryFilterUtilsImportsProvider =
  TsImportMapProviderFromSchema<typeof prismaQueryFilterUtilsImportsSchema>;

export const prismaQueryFilterUtilsImportsProvider =
  createReadOnlyProviderType<PrismaQueryFilterUtilsImportsProvider>(
    'prisma-query-filter-utils-imports',
  );

const prismaPrismaQueryFilterUtilsImportsTask = createGeneratorTask({
  dependencies: {
    paths: PRISMA_PRISMA_QUERY_FILTER_UTILS_PATHS.provider,
  },
  exports: {
    prismaQueryFilterUtilsImports:
      prismaQueryFilterUtilsImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        prismaQueryFilterUtilsImports: createTsImportMap(
          prismaQueryFilterUtilsImportsSchema,
          {
            createModelQueryFilter: paths.utilsQueryFilters,
            ModelQueryFilter: paths.utilsQueryFilters,
            ModelQueryFilterConfig: paths.utilsQueryFilters,
            QueryFilterBuildWhereOptions: paths.utilsQueryFilters,
            QueryFilterRole: paths.utilsQueryFilters,
            queryHelpers: paths.utilsQueryHelpers,
            WhereResult: paths.utilsQueryHelpers,
          },
        ),
      },
    };
  },
});

export const PRISMA_PRISMA_QUERY_FILTER_UTILS_IMPORTS = {
  task: prismaPrismaQueryFilterUtilsImportsTask,
};
