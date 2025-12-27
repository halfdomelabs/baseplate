import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PrismaPrismaAuthorizerUtilsPaths {
  utilsAuthorizers: string;
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
          utilsAuthorizers: `${srcRoot}/utils/authorizers.ts`,
        },
      },
    };
  },
});

export const PRISMA_PRISMA_AUTHORIZER_UTILS_PATHS = {
  provider: prismaPrismaAuthorizerUtilsPaths,
  task: prismaPrismaAuthorizerUtilsPathsTask,
};
