import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { configServiceImportsProvider } from '#src/generators/core/config-service/generated/ts-import-providers.js';

const appUrls = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { configServiceImports: configServiceImportsProvider },
  name: 'app-urls',
  projectExports: {
    getApiUrl: { isTypeOnly: false },
    getWebAppForUrl: { isTypeOnly: false },
    getWebOrigins: { isTypeOnly: false },
    getWebUrl: { isTypeOnly: false },
    WebAppName: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/app-urls.ts',
    ),
  },
  variables: { TPL_WEB_APP_NAMES: {}, TPL_WEB_APP_ORIGINS: {} },
});

export const CORE_APP_URLS_TEMPLATES = { appUrls };
