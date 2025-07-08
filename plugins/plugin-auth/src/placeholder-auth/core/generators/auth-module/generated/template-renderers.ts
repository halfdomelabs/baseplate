import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  authContextImportsProvider,
  userSessionTypesImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { PLACEHOLDER_AUTH_CORE_AUTH_MODULE_PATHS } from './template-paths.js';
import { PLACEHOLDER_AUTH_CORE_AUTH_MODULE_TEMPLATES } from './typed-templates.js';

export interface PlaceholderAuthCoreAuthModuleRenderers {
  userSessionService: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof PLACEHOLDER_AUTH_CORE_AUTH_MODULE_TEMPLATES.userSessionService
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const placeholderAuthCoreAuthModuleRenderers =
  createProviderType<PlaceholderAuthCoreAuthModuleRenderers>(
    'placeholder-auth-core-auth-module-renderers',
  );

const placeholderAuthCoreAuthModuleRenderersTask = createGeneratorTask({
  dependencies: {
    authContextImports: authContextImportsProvider,
    paths: PLACEHOLDER_AUTH_CORE_AUTH_MODULE_PATHS.provider,
    typescriptFile: typescriptFileProvider,
    userSessionTypesImports: userSessionTypesImportsProvider,
  },
  exports: {
    placeholderAuthCoreAuthModuleRenderers:
      placeholderAuthCoreAuthModuleRenderers.export(),
  },
  run({ authContextImports, paths, typescriptFile, userSessionTypesImports }) {
    return {
      providers: {
        placeholderAuthCoreAuthModuleRenderers: {
          userSessionService: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  PLACEHOLDER_AUTH_CORE_AUTH_MODULE_TEMPLATES.userSessionService,
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

export const PLACEHOLDER_AUTH_CORE_AUTH_MODULE_RENDERERS = {
  provider: placeholderAuthCoreAuthModuleRenderers,
  task: placeholderAuthCoreAuthModuleRenderersTask,
};
