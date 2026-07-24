import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PothosPothosPrismaFiltersFilePaths {
  filters: string;
}

const pothosPothosPrismaFiltersFilePaths =
  createProviderType<PothosPothosPrismaFiltersFilePaths>(
    'pothos-pothos-prisma-filters-file-paths',
  );

const pothosPothosPrismaFiltersFilePathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    pothosPothosPrismaFiltersFilePaths:
      pothosPothosPrismaFiltersFilePaths.export(),
  },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        pothosPothosPrismaFiltersFilePaths: {
          filters: `${srcRoot}/plugins/graphql/filters.ts`,
        },
      },
    };
  },
});

export const POTHOS_POTHOS_PRISMA_FILTERS_FILE_PATHS = {
  provider: pothosPothosPrismaFiltersFilePaths,
  task: pothosPothosPrismaFiltersFilePathsTask,
};
