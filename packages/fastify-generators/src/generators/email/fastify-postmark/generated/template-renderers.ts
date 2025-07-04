import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { configServiceImportsProvider } from '#src/generators/core/config-service/generated/ts-import-providers.js';

import { EMAIL_FASTIFY_POSTMARK_PATHS } from './template-paths.js';
import { EMAIL_FASTIFY_POSTMARK_TEMPLATES } from './typed-templates.js';

export interface EmailFastifyPostmarkRenderers {
  postmark: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof EMAIL_FASTIFY_POSTMARK_TEMPLATES.postmark
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const emailFastifyPostmarkRenderers =
  createProviderType<EmailFastifyPostmarkRenderers>(
    'email-fastify-postmark-renderers',
  );

const emailFastifyPostmarkRenderersTask = createGeneratorTask({
  dependencies: {
    configServiceImports: configServiceImportsProvider,
    paths: EMAIL_FASTIFY_POSTMARK_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    emailFastifyPostmarkRenderers: emailFastifyPostmarkRenderers.export(),
  },
  run({ configServiceImports, paths, typescriptFile }) {
    return {
      providers: {
        emailFastifyPostmarkRenderers: {
          postmark: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: EMAIL_FASTIFY_POSTMARK_TEMPLATES.postmark,
                destination: paths.postmark,
                importMapProviders: {
                  configServiceImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const EMAIL_FASTIFY_POSTMARK_RENDERERS = {
  provider: emailFastifyPostmarkRenderers,
  task: emailFastifyPostmarkRenderersTask,
};
