import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  authRolesImportsProvider,
  prismaGeneratedImportsProvider,
  prismaImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { authEmailPasswordImportsProvider } from '#src/local-auth/core/generators/auth-email-password/generated/ts-import-providers.js';

import { LOCAL_AUTH_CORE_SEED_INITIAL_USER_PATHS } from './template-paths.js';
import { LOCAL_AUTH_CORE_SEED_INITIAL_USER_TEMPLATES } from './typed-templates.js';

export interface LocalAuthCoreSeedInitialUserRenderers {
  seedInitialUser: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof LOCAL_AUTH_CORE_SEED_INITIAL_USER_TEMPLATES.seedInitialUser
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const localAuthCoreSeedInitialUserRenderers =
  createProviderType<LocalAuthCoreSeedInitialUserRenderers>(
    'local-auth-core-seed-initial-user-renderers',
  );

const localAuthCoreSeedInitialUserRenderersTask = createGeneratorTask({
  dependencies: {
    authEmailPasswordImports: authEmailPasswordImportsProvider,
    authRolesImports: authRolesImportsProvider,
    paths: LOCAL_AUTH_CORE_SEED_INITIAL_USER_PATHS.provider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    localAuthCoreSeedInitialUserRenderers:
      localAuthCoreSeedInitialUserRenderers.export(),
  },
  run({
    authEmailPasswordImports,
    authRolesImports,
    paths,
    prismaGeneratedImports,
    prismaImports,
    typescriptFile,
  }) {
    return {
      providers: {
        localAuthCoreSeedInitialUserRenderers: {
          seedInitialUser: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  LOCAL_AUTH_CORE_SEED_INITIAL_USER_TEMPLATES.seedInitialUser,
                destination: paths.seedInitialUser,
                importMapProviders: {
                  authEmailPasswordImports,
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

export const LOCAL_AUTH_CORE_SEED_INITIAL_USER_RENDERERS = {
  provider: localAuthCoreSeedInitialUserRenderers,
  task: localAuthCoreSeedInitialUserRenderersTask,
};
