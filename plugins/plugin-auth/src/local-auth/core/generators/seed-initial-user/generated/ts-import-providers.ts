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

import { LOCAL_AUTH_CORE_SEED_INITIAL_USER_PATHS } from './template-paths.js';

export const seedInitialUserImportsSchema = createTsImportMapSchema({
  seedInitialUser: {},
});

export type SeedInitialUserImportsProvider = TsImportMapProviderFromSchema<
  typeof seedInitialUserImportsSchema
>;

export const seedInitialUserImportsProvider =
  createReadOnlyProviderType<SeedInitialUserImportsProvider>(
    'seed-initial-user-imports',
  );

const localAuthCoreSeedInitialUserImportsTask = createGeneratorTask({
  dependencies: {
    paths: LOCAL_AUTH_CORE_SEED_INITIAL_USER_PATHS.provider,
  },
  exports: {
    seedInitialUserImports: seedInitialUserImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        seedInitialUserImports: createTsImportMap(
          seedInitialUserImportsSchema,
          { seedInitialUser: paths.seedInitialUser },
        ),
      },
    };
  },
});

export const LOCAL_AUTH_CORE_SEED_INITIAL_USER_IMPORTS = {
  task: localAuthCoreSeedInitialUserImportsTask,
};
