import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { appModuleSetupImportsProvider } from '#src/generators/core/app-module-setup/generated/ts-import-providers.js';

const index = createTsTemplateFile({
  fileOptions: { kind: 'instance', generatorTemplatePath: 'index.ts' },
  importMapProviders: { appModuleSetupImports: appModuleSetupImportsProvider },
  name: 'index',
  source: {
    path: path.join(import.meta.dirname, '../templates/index.ts'),
  },
  variables: { TPL_IMPORTS: {}, TPL_MODULE_CONTENTS: {}, TPL_MODULE_NAME: {} },
});

export const CORE_APP_MODULE_TEMPLATES = { index };
