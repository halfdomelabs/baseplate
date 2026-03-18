import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  authRolesImportsProvider,
  prismaGeneratedImportsProvider,
  prismaImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { BETTER_AUTH_SEED_INITIAL_USER_PATHS } from './template-paths.js';
import { BETTER_AUTH_SEED_INITIAL_USER_TEMPLATES } from './typed-templates.js';

export interface BetterAuthSeedInitialUserRenderers {
  seedInitialUser: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof BETTER_AUTH_SEED_INITIAL_USER_TEMPLATES.seedInitialUser
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const betterAuthSeedInitialUserRenderers =
  createProviderType<BetterAuthSeedInitialUserRenderers>(
    'better-auth-seed-initial-user-renderers',
  );

const betterAuthSeedInitialUserRenderersTask = createGeneratorTask({
  dependencies: {
    authRolesImports: authRolesImportsProvider,
    paths: BETTER_AUTH_SEED_INITIAL_USER_PATHS.provider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    betterAuthSeedInitialUserRenderers:
      betterAuthSeedInitialUserRenderers.export(),
  },
  run({
    authRolesImports,
    paths,
    prismaGeneratedImports,
    prismaImports,
    typescriptFile,
  }) {
    return {
      providers: {
        betterAuthSeedInitialUserRenderers: {
          seedInitialUser: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  BETTER_AUTH_SEED_INITIAL_USER_TEMPLATES.seedInitialUser,
                destination: paths.seedInitialUser,
                importMapProviders: {
                  authRolesImports,
                  prismaGeneratedImports,
                  prismaImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const BETTER_AUTH_SEED_INITIAL_USER_RENDERERS = {
  provider: betterAuthSeedInitialUserRenderers,
  task: betterAuthSeedInitialUserRenderersTask,
};
