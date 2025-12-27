import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PrismaAuthorizerUtilsStubPaths {
  utilsAuthorizers: string;
}

const prismaAuthorizerUtilsStubPaths =
  createProviderType<PrismaAuthorizerUtilsStubPaths>(
    'prisma-authorizer-utils-stub-paths',
  );

const prismaAuthorizerUtilsStubPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    prismaAuthorizerUtilsStubPaths: prismaAuthorizerUtilsStubPaths.export(),
  },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        prismaAuthorizerUtilsStubPaths: {
          utilsAuthorizers: `${srcRoot}/utils/authorizers.ts`,
        },
      },
    };
  },
});

export const PRISMA_AUTHORIZER_UTILS_STUB_PATHS = {
  provider: prismaAuthorizerUtilsStubPaths,
  task: prismaAuthorizerUtilsStubPathsTask,
};
