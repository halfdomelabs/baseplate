import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PrismaAuthorizerUtilsPaths {
  utilsAuthorizers: string;
}

const prismaAuthorizerUtilsPaths =
  createProviderType<PrismaAuthorizerUtilsPaths>(
    'prisma-authorizer-utils-paths',
  );

const prismaAuthorizerUtilsPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { prismaAuthorizerUtilsPaths: prismaAuthorizerUtilsPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        prismaAuthorizerUtilsPaths: {
          utilsAuthorizers: `${srcRoot}/utils/authorizers.ts`,
        },
      },
    };
  },
});

export const PRISMA_AUTHORIZER_UTILS_PATHS = {
  provider: prismaAuthorizerUtilsPaths,
  task: prismaAuthorizerUtilsPathsTask,
};
