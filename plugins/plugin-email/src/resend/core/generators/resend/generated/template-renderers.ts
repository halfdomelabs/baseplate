import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { configServiceImportsProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { emailModuleImportsProvider } from '#src/email/core/generators/email-module/generated/ts-import-providers.js';

import { RESEND_CORE_RESEND_PATHS } from './template-paths.js';
import { RESEND_CORE_RESEND_TEMPLATES } from './typed-templates.js';

export interface ResendCoreResendRenderers {
  resendService: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof RESEND_CORE_RESEND_TEMPLATES.resendService
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const resendCoreResendRenderers = createProviderType<ResendCoreResendRenderers>(
  'resend-core-resend-renderers',
);

const resendCoreResendRenderersTask = createGeneratorTask({
  dependencies: {
    configServiceImports: configServiceImportsProvider,
    emailModuleImports: emailModuleImportsProvider,
    paths: RESEND_CORE_RESEND_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { resendCoreResendRenderers: resendCoreResendRenderers.export() },
  run({ configServiceImports, emailModuleImports, paths, typescriptFile }) {
    return {
      providers: {
        resendCoreResendRenderers: {
          resendService: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: RESEND_CORE_RESEND_TEMPLATES.resendService,
                destination: paths.resendService,
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

export const RESEND_CORE_RESEND_RENDERERS = {
  provider: resendCoreResendRenderers,
  task: resendCoreResendRenderersTask,
};
