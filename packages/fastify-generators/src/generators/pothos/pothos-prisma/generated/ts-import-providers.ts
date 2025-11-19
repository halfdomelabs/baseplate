import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { POTHOS_POTHOS_PRISMA_PATHS } from './template-paths.js';

export const pothosPrismaImportsSchema = createTsImportMapSchema({
  getDatamodel: {},
  PrismaTypes: { isTypeOnly: true, exportedAs: 'default' },
});

export type PothosPrismaImportsProvider = TsImportMapProviderFromSchema<
  typeof pothosPrismaImportsSchema
>;

export const pothosPrismaImportsProvider =
  createReadOnlyProviderType<PothosPrismaImportsProvider>(
    'pothos-prisma-imports',
  );

const pothosPothosPrismaImportsTask = createGeneratorTask({
  dependencies: {
    paths: POTHOS_POTHOS_PRISMA_PATHS.provider,
  },
  exports: {
    pothosPrismaImports: pothosPrismaImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        pothosPrismaImports: createTsImportMap(pothosPrismaImportsSchema, {
          getDatamodel: paths.pothosPrismaTypes,
          PrismaTypes: paths.pothosPrismaTypes,
        }),
      },
    };
  },
});

export const POTHOS_POTHOS_PRISMA_IMPORTS = {
  task: pothosPothosPrismaImportsTask,
};
