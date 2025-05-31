import { createTsTemplateFile } from '@baseplate-dev/core-generators';

const appModules = createTsTemplateFile({
  name: 'app-modules',
  projectExports: { flattenAppModule: {} },
  source: { path: 'app-modules.ts' },
  variables: {
    TPL_MODULE_FIELDS: {},
    TPL_MODULE_INITIALIZER: {},
    TPL_MODULE_MERGER: {},
  },
});

export const CORE_APP_MODULE_SETUP_TS_TEMPLATES = { appModules };
