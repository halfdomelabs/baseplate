import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { betterAuthImportsProvider } from '#src/better-auth/generators/react/react-better-auth/generated/ts-import-providers.js';

import { BETTER_AUTH_BETTER_AUTH_PAGES_PATHS } from './template-paths.js';
import { BETTER_AUTH_BETTER_AUTH_PAGES_TEMPLATES } from './typed-templates.js';

export interface BetterAuthBetterAuthPagesRenderers {
  pagesGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof BETTER_AUTH_BETTER_AUTH_PAGES_TEMPLATES.pagesGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const betterAuthBetterAuthPagesRenderers =
  createProviderType<BetterAuthBetterAuthPagesRenderers>(
    'better-auth-better-auth-pages-renderers',
  );

const betterAuthBetterAuthPagesRenderersTask = createGeneratorTask({
  dependencies: {
    betterAuthImports: betterAuthImportsProvider,
    paths: BETTER_AUTH_BETTER_AUTH_PAGES_PATHS.provider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    betterAuthBetterAuthPagesRenderers:
      betterAuthBetterAuthPagesRenderers.export(),
  },
  run({
    betterAuthImports,
    paths,
    reactComponentsImports,
    reactErrorImports,
    typescriptFile,
  }) {
    return {
      providers: {
        betterAuthBetterAuthPagesRenderers: {
          pagesGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: BETTER_AUTH_BETTER_AUTH_PAGES_TEMPLATES.pagesGroup,
                paths,
                importMapProviders: {
                  betterAuthImports,
                  reactComponentsImports,
                  reactErrorImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const BETTER_AUTH_BETTER_AUTH_PAGES_RENDERERS = {
  provider: betterAuthBetterAuthPagesRenderers,
  task: betterAuthBetterAuthPagesRenderersTask,
};
