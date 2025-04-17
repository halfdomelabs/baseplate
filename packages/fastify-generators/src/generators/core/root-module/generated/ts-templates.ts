import { createTsTemplateFile } from '@halfdomelabs/core-generators';

const appModules = createTsTemplateFile({
  name: 'app-modules',
  projectExports: { flattenAppModule: {} },
  source: { path: 'app-modules.ts' },
  variables: { TPL_MODULE_FIELDS: {}, TPL_MODULE_MERGER: {} },
});

const moduleIndex = createTsTemplateFile({
  name: 'module-index',
  projectExports: { RootModule: {} },
  source: { path: 'index.ts' },
  variables: { TPL_IMPORTS: {}, TPL_MODULE_CONTENTS: {}, TPL_MODULE_NAME: {} },
});

export const CORE_ROOT_MODULE_TS_TEMPLATES = { appModules, moduleIndex };
