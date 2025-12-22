import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PrismaPrismaPaths {
  client: string;
  prismaConfig: string;
  seed: string;
  service: string;
}

const prismaPrismaPaths = createProviderType<PrismaPrismaPaths>(
  'prisma-prisma-paths',
);

const prismaPrismaPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { prismaPrismaPaths: prismaPrismaPaths.export() },
  run({ packageInfo }) {
    const packageRoot = packageInfo.getPackageRoot();
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        prismaPrismaPaths: {
          client: `${srcRoot}/generated/prisma/client.ts`,
          prismaConfig: `${packageRoot}/prisma.config.ts`,
          seed: `${srcRoot}/prisma/seed.ts`,
          service: `${srcRoot}/services/prisma.ts`,
        },
      },
    };
  },
});

export const PRISMA_PRISMA_PATHS = {
  provider: prismaPrismaPaths,
  task: prismaPrismaPathsTask,
};
