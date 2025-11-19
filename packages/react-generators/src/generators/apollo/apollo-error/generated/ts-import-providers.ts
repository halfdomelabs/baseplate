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

import { APOLLO_APOLLO_ERROR_PATHS } from './template-paths.js';

export const apolloErrorImportsSchema = createTsImportMapSchema({
  getApolloErrorCode: {},
});

export type ApolloErrorImportsProvider = TsImportMapProviderFromSchema<
  typeof apolloErrorImportsSchema
>;

export const apolloErrorImportsProvider =
  createReadOnlyProviderType<ApolloErrorImportsProvider>(
    'apollo-error-imports',
  );

const apolloApolloErrorImportsTask = createGeneratorTask({
  dependencies: {
    paths: APOLLO_APOLLO_ERROR_PATHS.provider,
  },
  exports: {
    apolloErrorImports: apolloErrorImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        apolloErrorImports: createTsImportMap(apolloErrorImportsSchema, {
          getApolloErrorCode: paths.apolloError,
        }),
      },
    };
  },
});

export const APOLLO_APOLLO_ERROR_IMPORTS = {
  task: apolloApolloErrorImportsTask,
};
