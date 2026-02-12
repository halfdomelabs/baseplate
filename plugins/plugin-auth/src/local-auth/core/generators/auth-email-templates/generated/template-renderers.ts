import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { transactionalLibImportsProvider } from '@baseplate-dev/plugin-email';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { LOCAL_AUTH_AUTH_EMAIL_TEMPLATES_PATHS } from './template-paths.js';
import { LOCAL_AUTH_AUTH_EMAIL_TEMPLATES_TEMPLATES } from './typed-templates.js';

export interface LocalAuthAuthEmailTemplatesRenderers {
  accountVerificationEmail: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof LOCAL_AUTH_AUTH_EMAIL_TEMPLATES_TEMPLATES.accountVerificationEmail
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  passwordChangedEmail: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof LOCAL_AUTH_AUTH_EMAIL_TEMPLATES_TEMPLATES.passwordChangedEmail
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  passwordResetEmail: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof LOCAL_AUTH_AUTH_EMAIL_TEMPLATES_TEMPLATES.passwordResetEmail
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const localAuthAuthEmailTemplatesRenderers =
  createProviderType<LocalAuthAuthEmailTemplatesRenderers>(
    'local-auth-auth-email-templates-renderers',
  );

const localAuthAuthEmailTemplatesRenderersTask = createGeneratorTask({
  dependencies: {
    paths: LOCAL_AUTH_AUTH_EMAIL_TEMPLATES_PATHS.provider,
    transactionalLibImports: transactionalLibImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    localAuthAuthEmailTemplatesRenderers:
      localAuthAuthEmailTemplatesRenderers.export(),
  },
  run({ paths, transactionalLibImports, typescriptFile }) {
    return {
      providers: {
        localAuthAuthEmailTemplatesRenderers: {
          accountVerificationEmail: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  LOCAL_AUTH_AUTH_EMAIL_TEMPLATES_TEMPLATES.accountVerificationEmail,
                destination: paths.accountVerificationEmail,
                importMapProviders: {
                  transactionalLibImports,
                },
                ...options,
              }),
          },
          passwordChangedEmail: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  LOCAL_AUTH_AUTH_EMAIL_TEMPLATES_TEMPLATES.passwordChangedEmail,
                destination: paths.passwordChangedEmail,
                importMapProviders: {
                  transactionalLibImports,
                },
                ...options,
              }),
          },
          passwordResetEmail: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  LOCAL_AUTH_AUTH_EMAIL_TEMPLATES_TEMPLATES.passwordResetEmail,
                destination: paths.passwordResetEmail,
                importMapProviders: {
                  transactionalLibImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const LOCAL_AUTH_AUTH_EMAIL_TEMPLATES_RENDERERS = {
  provider: localAuthAuthEmailTemplatesRenderers,
  task: localAuthAuthEmailTemplatesRenderersTask,
};
