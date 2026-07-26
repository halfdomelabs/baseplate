import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { authContextImportsProvider } from '#src/generators/auth/auth-context/generated/ts-import-providers.js';
import { appRuntimeImportsProvider } from '#src/generators/core/app-runtime/generated/ts-import-providers.js';

import { AUTH_AUTH_PLUGIN_PATHS } from './template-paths.js';
import { AUTH_AUTH_PLUGIN_TEMPLATES } from './typed-templates.js';

export interface AuthAuthPluginRenderers {
  authPlugin: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof AUTH_AUTH_PLUGIN_TEMPLATES.authPlugin
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const authAuthPluginRenderers = createProviderType<AuthAuthPluginRenderers>(
  'auth-auth-plugin-renderers',
);

const authAuthPluginRenderersTask = createGeneratorTask({
  dependencies: {
    appRuntimeImports: appRuntimeImportsProvider,
    authContextImports: authContextImportsProvider,
    paths: AUTH_AUTH_PLUGIN_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { authAuthPluginRenderers: authAuthPluginRenderers.export() },
  run({ appRuntimeImports, authContextImports, paths, typescriptFile }) {
    return {
      providers: {
        authAuthPluginRenderers: {
          authPlugin: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: AUTH_AUTH_PLUGIN_TEMPLATES.authPlugin,
                destination: paths.authPlugin,
                importMapProviders: {
                  appRuntimeImports,
                  authContextImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const AUTH_AUTH_PLUGIN_RENDERERS = {
  provider: authAuthPluginRenderers,
  task: authAuthPluginRenderersTask,
};
