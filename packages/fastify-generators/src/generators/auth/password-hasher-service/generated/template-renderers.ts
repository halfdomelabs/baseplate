import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { AUTH_PASSWORD_HASHER_SERVICE_PATHS } from './template-paths.js';
import { AUTH_PASSWORD_HASHER_SERVICE_TEMPLATES } from './typed-templates.js';

export interface AuthPasswordHasherServiceRenderers {
  passwordHasherService: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof AUTH_PASSWORD_HASHER_SERVICE_TEMPLATES.passwordHasherService
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const authPasswordHasherServiceRenderers =
  createProviderType<AuthPasswordHasherServiceRenderers>(
    'auth-password-hasher-service-renderers',
  );

const authPasswordHasherServiceRenderersTask = createGeneratorTask({
  dependencies: {
    paths: AUTH_PASSWORD_HASHER_SERVICE_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    authPasswordHasherServiceRenderers:
      authPasswordHasherServiceRenderers.export(),
  },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        authPasswordHasherServiceRenderers: {
          passwordHasherService: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  AUTH_PASSWORD_HASHER_SERVICE_TEMPLATES.passwordHasherService,
                destination: paths.passwordHasherService,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const AUTH_PASSWORD_HASHER_SERVICE_RENDERERS = {
  provider: authPasswordHasherServiceRenderers,
  task: authPasswordHasherServiceRenderersTask,
};
