import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { appModuleProvider } from '#src/generators/core/app-module/app-module.generator.js';

export interface AuthAuthPluginPaths {
  authPlugin: string;
}

const authAuthPluginPaths = createProviderType<AuthAuthPluginPaths>(
  'auth-auth-plugin-paths',
);

const authAuthPluginPathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: { authAuthPluginPaths: authAuthPluginPaths.export() },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        authAuthPluginPaths: {
          authPlugin: `${moduleRoot}/plugins/auth.plugin.ts`,
        },
      },
    };
  },
});

export const AUTH_AUTH_PLUGIN_PATHS = {
  provider: authAuthPluginPaths,
  task: authAuthPluginPathsTask,
};
