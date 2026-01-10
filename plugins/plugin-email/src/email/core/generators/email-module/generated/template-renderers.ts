import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  configServiceImportsProvider,
  loggerServiceImportsProvider,
} from '@baseplate-dev/fastify-generators';
import {
  queueServiceImportsProvider,
  queuesImportsProvider,
} from '@baseplate-dev/plugin-queue';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { EMAIL_CORE_EMAIL_MODULE_PATHS } from './template-paths.js';
import { EMAIL_CORE_EMAIL_MODULE_TEMPLATES } from './typed-templates.js';

export interface EmailCoreEmailModuleRenderers {
  mainGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof EMAIL_CORE_EMAIL_MODULE_TEMPLATES.mainGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const emailCoreEmailModuleRenderers =
  createProviderType<EmailCoreEmailModuleRenderers>(
    'email-core-email-module-renderers',
  );

const emailCoreEmailModuleRenderersTask = createGeneratorTask({
  dependencies: {
    configServiceImports: configServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    paths: EMAIL_CORE_EMAIL_MODULE_PATHS.provider,
    queueServiceImports: queueServiceImportsProvider,
    queuesImports: queuesImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    emailCoreEmailModuleRenderers: emailCoreEmailModuleRenderers.export(),
  },
  run({
    configServiceImports,
    loggerServiceImports,
    paths,
    queueServiceImports,
    queuesImports,
    typescriptFile,
  }) {
    return {
      providers: {
        emailCoreEmailModuleRenderers: {
          mainGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: EMAIL_CORE_EMAIL_MODULE_TEMPLATES.mainGroup,
                paths,
                importMapProviders: {
                  configServiceImports,
                  loggerServiceImports,
                  queueServiceImports,
                  queuesImports,
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

export const EMAIL_CORE_EMAIL_MODULE_RENDERERS = {
  provider: emailCoreEmailModuleRenderers,
  task: emailCoreEmailModuleRenderersTask,
};
