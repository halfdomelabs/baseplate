import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const appModules = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'app-modules',
  projectExports: { flattenAppModule: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/utils/app-modules.ts',
    ),
  },
  variables: {
    TPL_MODULE_FIELDS: {},
    TPL_MODULE_INITIALIZER: {},
    TPL_MODULE_MERGER: {},
  },
});

export const CORE_APP_MODULE_SETUP_TEMPLATES = { appModules };
