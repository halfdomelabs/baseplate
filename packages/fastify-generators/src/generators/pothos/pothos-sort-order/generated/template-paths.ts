import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PothosPothosSortOrderPaths {
  sortOrder: string;
}

const pothosPothosSortOrderPaths =
  createProviderType<PothosPothosSortOrderPaths>(
    'pothos-pothos-sort-order-paths',
  );

const pothosPothosSortOrderPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { pothosPothosSortOrderPaths: pothosPothosSortOrderPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        pothosPothosSortOrderPaths: {
          sortOrder: `${srcRoot}/plugins/graphql/sort-order.ts`,
        },
      },
    };
  },
});

export const POTHOS_POTHOS_SORT_ORDER_PATHS = {
  provider: pothosPothosSortOrderPaths,
  task: pothosPothosSortOrderPathsTask,
};
