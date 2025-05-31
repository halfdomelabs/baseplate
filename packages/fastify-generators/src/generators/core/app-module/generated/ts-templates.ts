import { createTsTemplateFile } from '@baseplate-dev/core-generators';

import { appModuleSetupImportsProvider } from '../../app-module-setup/generated/ts-import-maps.js';

const index = createTsTemplateFile({
  importMapProviders: { appModuleSetupImports: appModuleSetupImportsProvider },
  name: 'index',
  projectExports: {},
  source: { path: 'index.ts' },
  variables: { TPL_IMPORTS: {}, TPL_MODULE_CONTENTS: {}, TPL_MODULE_NAME: {} },
});

export const CORE_APP_MODULE_TS_TEMPLATES = { index };
