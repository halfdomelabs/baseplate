import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PothosPothosPrismaPaths {
  pothosPrismaTypes: string;
}

const pothosPothosPrismaPaths = createProviderType<PothosPothosPrismaPaths>(
  'pothos-pothos-prisma-paths',
);

const pothosPothosPrismaPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { pothosPothosPrismaPaths: pothosPothosPrismaPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        pothosPothosPrismaPaths: {
          pothosPrismaTypes: `${srcRoot}/generated/prisma/pothos-prisma-types.ts`,
        },
      },
    };
  },
});

export const POTHOS_POTHOS_PRISMA_PATHS = {
  provider: pothosPothosPrismaPaths,
  task: pothosPothosPrismaPathsTask,
};
