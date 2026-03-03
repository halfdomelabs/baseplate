import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  authHooksImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { BETTER_AUTH_REACT_BETTER_AUTH_PATHS } from './template-paths.js';
import { BETTER_AUTH_REACT_BETTER_AUTH_TEMPLATES } from './typed-templates.js';

export interface BetterAuthReactBetterAuthRenderers {
  authClient: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof BETTER_AUTH_REACT_BETTER_AUTH_TEMPLATES.authClient
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  authLoadedGate: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof BETTER_AUTH_REACT_BETTER_AUTH_TEMPLATES.authLoadedGate
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const betterAuthReactBetterAuthRenderers =
  createProviderType<BetterAuthReactBetterAuthRenderers>(
    'better-auth-react-better-auth-renderers',
  );

const betterAuthReactBetterAuthRenderersTask = createGeneratorTask({
  dependencies: {
    authHooksImports: authHooksImportsProvider,
    paths: BETTER_AUTH_REACT_BETTER_AUTH_PATHS.provider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    betterAuthReactBetterAuthRenderers:
      betterAuthReactBetterAuthRenderers.export(),
  },
  run({
    authHooksImports,
    paths,
    reactComponentsImports,
    reactErrorImports,
    typescriptFile,
  }) {
    return {
      providers: {
        betterAuthReactBetterAuthRenderers: {
          authClient: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: BETTER_AUTH_REACT_BETTER_AUTH_TEMPLATES.authClient,
                destination: paths.authClient,
                ...options,
              }),
          },
          authLoadedGate: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  BETTER_AUTH_REACT_BETTER_AUTH_TEMPLATES.authLoadedGate,
                destination: paths.authLoadedGate,
                importMapProviders: {
                  authHooksImports,
                  reactComponentsImports,
                  reactErrorImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const BETTER_AUTH_REACT_BETTER_AUTH_RENDERERS = {
  provider: betterAuthReactBetterAuthRenderers,
  task: betterAuthReactBetterAuthRenderersTask,
};
