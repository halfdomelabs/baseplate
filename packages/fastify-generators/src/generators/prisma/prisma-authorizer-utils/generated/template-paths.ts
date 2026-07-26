import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PrismaPrismaAuthorizerUtilsPaths {
  createModelPolicy: string;
  fieldGates: string;
  types: string;
}

const prismaPrismaAuthorizerUtilsPaths =
  createProviderType<PrismaPrismaAuthorizerUtilsPaths>(
    'prisma-prisma-authorizer-utils-paths',
  );

const prismaPrismaAuthorizerUtilsPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    prismaPrismaAuthorizerUtilsPaths: prismaPrismaAuthorizerUtilsPaths.export(),
  },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        prismaPrismaAuthorizerUtilsPaths: {
          createModelPolicy: `${srcRoot}/utils/authorizers/create-model-policy.ts`,
          fieldGates: `${srcRoot}/utils/authorizers/field-gates.ts`,
          types: `${srcRoot}/utils/authorizers/types.ts`,
        },
      },
    };
  },
});

export const PRISMA_PRISMA_AUTHORIZER_UTILS_PATHS = {
  provider: prismaPrismaAuthorizerUtilsPaths,
  task: prismaPrismaAuthorizerUtilsPathsTask,
};
