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

import { CORE_FASTIFY_SENTRY_PATHS } from './template-paths.js';

export const fastifySentryImportsSchema = createTsImportMapSchema({
  isSentryEnabled: {},
  logErrorToSentry: {},
  registerSentryEventProcessor: {},
  shouldLogToSentry: {},
});

export type FastifySentryImportsProvider = TsImportMapProviderFromSchema<
  typeof fastifySentryImportsSchema
>;

export const fastifySentryImportsProvider =
  createReadOnlyProviderType<FastifySentryImportsProvider>(
    'fastify-sentry-imports',
  );

const coreFastifySentryImportsTask = createGeneratorTask({
  dependencies: {
    paths: CORE_FASTIFY_SENTRY_PATHS.provider,
  },
  exports: {
    fastifySentryImports: fastifySentryImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        fastifySentryImports: createTsImportMap(fastifySentryImportsSchema, {
          isSentryEnabled: paths.sentry,
          logErrorToSentry: paths.sentry,
          registerSentryEventProcessor: paths.sentry,
          shouldLogToSentry: paths.sentry,
        }),
      },
    };
  },
});

export const CORE_FASTIFY_SENTRY_IMPORTS = {
  task: coreFastifySentryImportsTask,
};
