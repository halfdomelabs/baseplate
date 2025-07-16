import type {
  RenderTextTemplateFileActionInput,
  RenderTsTemplateGroupActionInput,
} from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import {
  renderTextTemplateFileAction,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
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
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  useCurrentUserGql: {
    render: (
      options: Omit<
        RenderTextTemplateFileActionInput<
          typeof PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_HOOKS_TEMPLATES.useCurrentUserGql
        >,
        'destination' | 'template'
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
                  generatorPaths: paths,
                  ...options,
                }),
            },
            useCurrentUserGql: {
              render: (options) =>
                renderTextTemplateFileAction({
                  template:
                    PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_HOOKS_TEMPLATES.useCurrentUserGql,
                  destination: paths.useCurrentUserGql,
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
