import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { reactErrorImportsProvider } from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { betterAuthImportsProvider } from '#src/better-auth/generators/react/react-better-auth/generated/ts-import-providers.js';

import { BETTER_AUTH_BETTER_AUTH_HOOKS_PATHS } from './template-paths.js';
import { BETTER_AUTH_BETTER_AUTH_HOOKS_TEMPLATES } from './typed-templates.js';

export interface BetterAuthBetterAuthHooksRenderers {
  hooksGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof BETTER_AUTH_BETTER_AUTH_HOOKS_TEMPLATES.hooksGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const betterAuthBetterAuthHooksRenderers =
  createProviderType<BetterAuthBetterAuthHooksRenderers>(
    'better-auth-better-auth-hooks-renderers',
  );

const betterAuthBetterAuthHooksRenderersTask = createGeneratorTask({
  dependencies: {
    betterAuthImports: betterAuthImportsProvider,
    paths: BETTER_AUTH_BETTER_AUTH_HOOKS_PATHS.provider,
    reactErrorImports: reactErrorImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    betterAuthBetterAuthHooksRenderers:
      betterAuthBetterAuthHooksRenderers.export(),
  },
  run({ betterAuthImports, paths, reactErrorImports, typescriptFile }) {
    return {
      providers: {
        betterAuthBetterAuthHooksRenderers: {
          hooksGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: BETTER_AUTH_BETTER_AUTH_HOOKS_TEMPLATES.hooksGroup,
                paths,
                importMapProviders: {
                  betterAuthImports,
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

export const BETTER_AUTH_BETTER_AUTH_HOOKS_RENDERERS = {
  provider: betterAuthBetterAuthHooksRenderers,
  task: betterAuthBetterAuthHooksRenderersTask,
};
