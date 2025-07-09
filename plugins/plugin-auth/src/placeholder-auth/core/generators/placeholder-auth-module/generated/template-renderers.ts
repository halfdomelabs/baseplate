import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  authContextImportsProvider,
  userSessionTypesImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_MODULE_PATHS } from './template-paths.js';
import { PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_MODULE_TEMPLATES } from './typed-templates.js';

export interface PlaceholderAuthCorePlaceholderAuthModuleRenderers {
  userSessionService: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_MODULE_TEMPLATES.userSessionService
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const placeholderAuthCorePlaceholderAuthModuleRenderers =
  createProviderType<PlaceholderAuthCorePlaceholderAuthModuleRenderers>(
    'placeholder-auth-core-placeholder-auth-module-renderers',
  );

const placeholderAuthCorePlaceholderAuthModuleRenderersTask =
  createGeneratorTask({
    dependencies: {
      authContextImports: authContextImportsProvider,
      paths: PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_MODULE_PATHS.provider,
      typescriptFile: typescriptFileProvider,
      userSessionTypesImports: userSessionTypesImportsProvider,
    },
    exports: {
      placeholderAuthCorePlaceholderAuthModuleRenderers:
        placeholderAuthCorePlaceholderAuthModuleRenderers.export(),
    },
    run({
      authContextImports,
      paths,
      typescriptFile,
      userSessionTypesImports,
    }) {
      return {
        providers: {
          placeholderAuthCorePlaceholderAuthModuleRenderers: {
            userSessionService: {
              render: (options) =>
                typescriptFile.renderTemplateFile({
                  template:
                    PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_MODULE_TEMPLATES.userSessionService,
                  destination: paths.userSessionService,
                  importMapProviders: {
                    authContextImports,
                    userSessionTypesImports,
                  },
                  ...options,
                }),
            },
          },
        },
      };
    },
  });

export const PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_MODULE_RENDERERS = {
  provider: placeholderAuthCorePlaceholderAuthModuleRenderers,
  task: placeholderAuthCorePlaceholderAuthModuleRenderersTask,
};
