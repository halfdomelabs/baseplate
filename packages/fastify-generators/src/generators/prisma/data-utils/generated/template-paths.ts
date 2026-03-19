import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PrismaDataUtilsPaths {
  defineTransformer: string;
  executeTransformPlan: string;
  nestedTransformers: string;
  prepareTransformers: string;
  prismaTypes: string;
  relationHelpers: string;
  transformerTypes: string;
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
          defineTransformer: `${srcRoot}/utils/data-operations/define-transformer.ts`,
          executeTransformPlan: `${srcRoot}/utils/data-operations/execute-transform-plan.ts`,
          nestedTransformers: `${srcRoot}/utils/data-operations/nested-transformers.ts`,
          prepareTransformers: `${srcRoot}/utils/data-operations/prepare-transformers.ts`,
          prismaTypes: `${srcRoot}/utils/data-operations/prisma-types.ts`,
          relationHelpers: `${srcRoot}/utils/data-operations/relation-helpers.ts`,
          transformerTypes: `${srcRoot}/utils/data-operations/transformer-types.ts`,
        },
      },
    };
  },
});

export const PRISMA_DATA_UTILS_PATHS = {
  provider: prismaDataUtilsPaths,
  task: prismaDataUtilsPathsTask,
};
