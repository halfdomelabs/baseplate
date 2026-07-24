import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { authContextImportsProvider } from '#src/generators/auth/auth-context/generated/ts-import-providers.js';
import { appModuleSetupImportsProvider } from '#src/generators/core/app-module-setup/generated/ts-import-providers.js';

const authPlugin = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    appModuleSetupImports: appModuleSetupImportsProvider,
    authContextImports: authContextImportsProvider,
  },
  name: 'auth-plugin',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/plugins/auth.plugin.ts',
    ),
  },
  variables: {},
});

export const AUTH_AUTH_PLUGIN_TEMPLATES = { authPlugin };
