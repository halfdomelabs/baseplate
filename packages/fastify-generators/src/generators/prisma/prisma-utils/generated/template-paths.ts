import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PrismaPrismaUtilsPaths {
  crudServiceTypes: string;
  dataPipes: string;
  embeddedOneToMany: string;
  embeddedOneToOne: string;
  embeddedTypes: string;
  prismaRelations: string;
}

const prismaPrismaUtilsPaths = createProviderType<PrismaPrismaUtilsPaths>(
  'prisma-prisma-utils-paths',
);

const prismaPrismaUtilsPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { prismaPrismaUtilsPaths: prismaPrismaUtilsPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        prismaPrismaUtilsPaths: {
          crudServiceTypes: `${srcRoot}/utils/crud-service-types.ts`,
          dataPipes: `${srcRoot}/utils/data-pipes.ts`,
          embeddedOneToMany: `${srcRoot}/utils/embedded-pipes/embedded-one-to-many.ts`,
          embeddedOneToOne: `${srcRoot}/utils/embedded-pipes/embedded-one-to-one.ts`,
          embeddedTypes: `${srcRoot}/utils/embedded-pipes/embedded-types.ts`,
          prismaRelations: `${srcRoot}/utils/prisma-relations.ts`,
        },
      },
    };
  },
});

export const PRISMA_PRISMA_UTILS_PATHS = {
  provider: prismaPrismaUtilsPaths,
  task: prismaPrismaUtilsPathsTask,
};
