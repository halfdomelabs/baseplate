import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PrismaPrismaQueryFilterUtilsPaths {
  utilsQueryFilters: string;
  utilsQueryHelpers: string;
}

const prismaPrismaQueryFilterUtilsPaths =
  createProviderType<PrismaPrismaQueryFilterUtilsPaths>(
    'prisma-prisma-query-filter-utils-paths',
  );

const prismaPrismaQueryFilterUtilsPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    prismaPrismaQueryFilterUtilsPaths:
      prismaPrismaQueryFilterUtilsPaths.export(),
  },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        prismaPrismaQueryFilterUtilsPaths: {
          utilsQueryFilters: `${srcRoot}/utils/query-filters.ts`,
          utilsQueryHelpers: `${srcRoot}/utils/query-helpers.ts`,
        },
      },
    };
  },
});

export const PRISMA_PRISMA_QUERY_FILTER_UTILS_PATHS = {
  provider: prismaPrismaQueryFilterUtilsPaths,
  task: prismaPrismaQueryFilterUtilsPathsTask,
};
