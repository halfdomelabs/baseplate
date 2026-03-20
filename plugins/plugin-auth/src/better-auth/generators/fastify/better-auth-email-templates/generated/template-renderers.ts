import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { transactionalLibImportsProvider } from '@baseplate-dev/plugin-email';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { BETTER_AUTH_BETTER_AUTH_EMAIL_TEMPLATES_PATHS } from './template-paths.js';
import { BETTER_AUTH_BETTER_AUTH_EMAIL_TEMPLATES_TEMPLATES } from './typed-templates.js';

export interface BetterAuthBetterAuthEmailTemplatesRenderers {
  accountVerificationEmail: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof BETTER_AUTH_BETTER_AUTH_EMAIL_TEMPLATES_TEMPLATES.accountVerificationEmail
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  passwordChangedEmail: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof BETTER_AUTH_BETTER_AUTH_EMAIL_TEMPLATES_TEMPLATES.passwordChangedEmail
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  passwordResetEmail: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof BETTER_AUTH_BETTER_AUTH_EMAIL_TEMPLATES_TEMPLATES.passwordResetEmail
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const betterAuthBetterAuthEmailTemplatesRenderers =
  createProviderType<BetterAuthBetterAuthEmailTemplatesRenderers>(
    'better-auth-better-auth-email-templates-renderers',
  );

const betterAuthBetterAuthEmailTemplatesRenderersTask = createGeneratorTask({
  dependencies: {
    paths: BETTER_AUTH_BETTER_AUTH_EMAIL_TEMPLATES_PATHS.provider,
    transactionalLibImports: transactionalLibImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    betterAuthBetterAuthEmailTemplatesRenderers:
      betterAuthBetterAuthEmailTemplatesRenderers.export(),
  },
  run({ paths, transactionalLibImports, typescriptFile }) {
    return {
      providers: {
        betterAuthBetterAuthEmailTemplatesRenderers: {
          accountVerificationEmail: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  BETTER_AUTH_BETTER_AUTH_EMAIL_TEMPLATES_TEMPLATES.accountVerificationEmail,
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
                  BETTER_AUTH_BETTER_AUTH_EMAIL_TEMPLATES_TEMPLATES.passwordChangedEmail,
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
                  BETTER_AUTH_BETTER_AUTH_EMAIL_TEMPLATES_TEMPLATES.passwordResetEmail,
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

export const BETTER_AUTH_BETTER_AUTH_EMAIL_TEMPLATES_RENDERERS = {
  provider: betterAuthBetterAuthEmailTemplatesRenderers,
  task: betterAuthBetterAuthEmailTemplatesRenderersTask,
};
