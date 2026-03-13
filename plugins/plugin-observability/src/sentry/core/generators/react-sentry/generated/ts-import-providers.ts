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

import { CORE_REACT_SENTRY_PATHS } from './template-paths.js';

export const reactSentryImportsSchema = createTsImportMapSchema({
  logBreadcrumbToSentry: {},
  logErrorToSentry: {},
});

export type ReactSentryImportsProvider = TsImportMapProviderFromSchema<
  typeof reactSentryImportsSchema
>;

export const reactSentryImportsProvider =
  createReadOnlyProviderType<ReactSentryImportsProvider>(
    'react-sentry-imports',
  );

const coreReactSentryImportsTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REACT_SENTRY_PATHS.provider,
  },
  exports: {
    reactSentryImports: reactSentryImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        reactSentryImports: createTsImportMap(reactSentryImportsSchema, {
          logBreadcrumbToSentry: paths.sentry,
          logErrorToSentry: paths.sentry,
        }),
      },
    };
  },
});

export const CORE_REACT_SENTRY_IMPORTS = {
  task: coreReactSentryImportsTask,
};
