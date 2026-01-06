import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { configServiceImportsProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { emailModuleImportsProvider } from '#src/email/core/generators/email-module/generated/ts-import-providers.js';

import { POSTMARK_POSTMARK_PATHS } from './template-paths.js';
import { POSTMARK_POSTMARK_TEMPLATES } from './typed-templates.js';

export interface PostmarkPostmarkRenderers {
  postmarkService: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof POSTMARK_POSTMARK_TEMPLATES.postmarkService
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const postmarkPostmarkRenderers = createProviderType<PostmarkPostmarkRenderers>(
  'postmark-postmark-renderers',
);

const postmarkPostmarkRenderersTask = createGeneratorTask({
  dependencies: {
    configServiceImports: configServiceImportsProvider,
    emailModuleImports: emailModuleImportsProvider,
    paths: POSTMARK_POSTMARK_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { postmarkPostmarkRenderers: postmarkPostmarkRenderers.export() },
  run({ configServiceImports, emailModuleImports, paths, typescriptFile }) {
    return {
      providers: {
        postmarkPostmarkRenderers: {
          postmarkService: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: POSTMARK_POSTMARK_TEMPLATES.postmarkService,
                destination: paths.postmarkService,
                importMapProviders: {
                  configServiceImports,
                  emailModuleImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const POSTMARK_POSTMARK_RENDERERS = {
  provider: postmarkPostmarkRenderers,
  task: postmarkPostmarkRenderersTask,
};
