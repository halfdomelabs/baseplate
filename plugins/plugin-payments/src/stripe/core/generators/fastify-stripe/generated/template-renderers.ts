import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  appRuntimeImportsProvider,
  configServiceImportsProvider,
  errorHandlerServiceImportsProvider,
  loggerServiceImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { STRIPE_FASTIFY_STRIPE_PATHS } from './template-paths.js';
import { STRIPE_FASTIFY_STRIPE_TEMPLATES } from './typed-templates.js';

export interface StripeFastifyStripeRenderers {
  pluginsGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof STRIPE_FASTIFY_STRIPE_TEMPLATES.pluginsGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  webhookServicesGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof STRIPE_FASTIFY_STRIPE_TEMPLATES.webhookServicesGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const stripeFastifyStripeRenderers =
  createProviderType<StripeFastifyStripeRenderers>(
    'stripe-fastify-stripe-renderers',
  );

const stripeFastifyStripeRenderersTask = createGeneratorTask({
  dependencies: {
    appRuntimeImports: appRuntimeImportsProvider,
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    paths: STRIPE_FASTIFY_STRIPE_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    stripeFastifyStripeRenderers: stripeFastifyStripeRenderers.export(),
  },
  run({
    appRuntimeImports,
    configServiceImports,
    errorHandlerServiceImports,
    loggerServiceImports,
    paths,
    typescriptFile,
  }) {
    return {
      providers: {
        stripeFastifyStripeRenderers: {
          pluginsGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: STRIPE_FASTIFY_STRIPE_TEMPLATES.pluginsGroup,
                paths,
                importMapProviders: {
                  appRuntimeImports,
                  configServiceImports,
                  errorHandlerServiceImports,
                  loggerServiceImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          webhookServicesGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: STRIPE_FASTIFY_STRIPE_TEMPLATES.webhookServicesGroup,
                paths,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const STRIPE_FASTIFY_STRIPE_RENDERERS = {
  provider: stripeFastifyStripeRenderers,
  task: stripeFastifyStripeRenderersTask,
};
