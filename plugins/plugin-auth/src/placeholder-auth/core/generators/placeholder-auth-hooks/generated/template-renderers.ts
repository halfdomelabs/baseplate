import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { generatedGraphqlImportsProvider } from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_HOOKS_PATHS } from './template-paths.js';
import { PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_HOOKS_TEMPLATES } from './typed-templates.js';

export interface PlaceholderAuthCorePlaceholderAuthHooksRenderers {
  hooksGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_HOOKS_TEMPLATES.hooksGroup
        >,
        'importMapProviders' | 'group' | 'paths'
      >,
    ) => BuilderAction;
  };
}

const placeholderAuthCorePlaceholderAuthHooksRenderers =
  createProviderType<PlaceholderAuthCorePlaceholderAuthHooksRenderers>(
    'placeholder-auth-core-placeholder-auth-hooks-renderers',
  );

const placeholderAuthCorePlaceholderAuthHooksRenderersTask =
  createGeneratorTask({
    dependencies: {
      generatedGraphqlImports: generatedGraphqlImportsProvider,
      paths: PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_HOOKS_PATHS.provider,
      typescriptFile: typescriptFileProvider,
    },
    exports: {
      placeholderAuthCorePlaceholderAuthHooksRenderers:
        placeholderAuthCorePlaceholderAuthHooksRenderers.export(),
    },
    run({ generatedGraphqlImports, paths, typescriptFile }) {
      return {
        providers: {
          placeholderAuthCorePlaceholderAuthHooksRenderers: {
            hooksGroup: {
              render: (options) =>
                typescriptFile.renderTemplateGroup({
                  group:
                    PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_HOOKS_TEMPLATES.hooksGroup,
                  paths,
                  importMapProviders: {
                    generatedGraphqlImports,
                  },
                  ...options,
                }),
            },
          },
        },
      };
    },
  });

export const PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_HOOKS_RENDERERS = {
  provider: placeholderAuthCorePlaceholderAuthHooksRenderers,
  task: placeholderAuthCorePlaceholderAuthHooksRenderersTask,
};
