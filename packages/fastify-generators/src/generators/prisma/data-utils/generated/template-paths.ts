import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PrismaDataUtilsPaths {
  defineOperations: string;
  fieldDefinitions: string;
  index: string;
  prismaTypes: string;
  prismaUtils: string;
  relationHelpers: string;
  types: string;
}

const prismaDataUtilsPaths = createProviderType<PrismaDataUtilsPaths>(
  'prisma-data-utils-paths',
);

const prismaDataUtilsPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { prismaDataUtilsPaths: prismaDataUtilsPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        prismaDataUtilsPaths: {
          defineOperations: `${srcRoot}/utils/data-operations/define-operations.ts`,
          fieldDefinitions: `${srcRoot}/utils/data-operations/field-definitions.ts`,
          index: `${srcRoot}/utils/data-operations/index.ts`,
          prismaTypes: `${srcRoot}/utils/data-operations/prisma-types.ts`,
          prismaUtils: `${srcRoot}/utils/data-operations/prisma-utils.ts`,
          relationHelpers: `${srcRoot}/utils/data-operations/relation-helpers.ts`,
          types: `${srcRoot}/utils/data-operations/types.ts`,
        },
      },
    };
  },
});

export const PRISMA_DATA_UTILS_PATHS = {
  provider: prismaDataUtilsPaths,
  task: prismaDataUtilsPathsTask,
};
