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

import { CORE_APP_URLS_PATHS } from './template-paths.js';

export const appUrlsImportsSchema = createTsImportMapSchema({
  getApiUrl: {},
  getWebAppForUrl: {},
  getWebOrigins: {},
  getWebUrl: {},
  WebAppName: { isTypeOnly: true },
});

export type AppUrlsImportsProvider = TsImportMapProviderFromSchema<
  typeof appUrlsImportsSchema
>;

export const appUrlsImportsProvider =
  createReadOnlyProviderType<AppUrlsImportsProvider>('app-urls-imports');

const coreAppUrlsImportsTask = createGeneratorTask({
  dependencies: {
    paths: CORE_APP_URLS_PATHS.provider,
  },
  exports: { appUrlsImports: appUrlsImportsProvider.export(packageScope) },
  run({ paths }) {
    return {
      providers: {
        appUrlsImports: createTsImportMap(appUrlsImportsSchema, {
          getApiUrl: paths.appUrls,
          getWebAppForUrl: paths.appUrls,
          getWebOrigins: paths.appUrls,
          getWebUrl: paths.appUrls,
          WebAppName: paths.appUrls,
        }),
      },
    };
  },
});

export const CORE_APP_URLS_IMPORTS = {
  generatorName: '@baseplate-dev/fastify-generators#core/app-urls',
  task: coreAppUrlsImportsTask,
};
