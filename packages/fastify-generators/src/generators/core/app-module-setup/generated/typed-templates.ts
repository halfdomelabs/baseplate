import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { appRuntimeImportsProvider } from '#src/generators/core/app-runtime/generated/ts-import-providers.js';

const appModules = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { appRuntimeImports: appRuntimeImportsProvider },
  name: 'app-modules',
  projectExports: {
    AppPlugin: { isTypeOnly: true },
    defineAppModule: {},
    flattenAppModule: {},
    PluginRuntime: { isTypeOnly: true },
    PluginRuntimeWithServices: { isTypeOnly: true },
  },
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
