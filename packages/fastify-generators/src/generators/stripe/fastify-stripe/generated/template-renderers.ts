import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { configServiceImportsProvider } from '#src/generators/core/config-service/generated/ts-import-providers.js';
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { loggerServiceImportsProvider } from '#src/generators/core/logger-service/generated/ts-import-providers.js';

import { STRIPE_FASTIFY_STRIPE_PATHS } from './template-paths.js';
import { STRIPE_FASTIFY_STRIPE_TEMPLATES } from './typed-templates.js';

export interface StripeFastifyStripeRenderers {
  pluginsGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof STRIPE_FASTIFY_STRIPE_TEMPLATES.pluginsGroup
        >,
        'importMapProviders' | 'group' | 'paths'
      >,
    ) => BuilderAction;
  };
  servicesGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof STRIPE_FASTIFY_STRIPE_TEMPLATES.servicesGroup
        >,
        'importMapProviders' | 'group' | 'paths'
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
                  configServiceImports,
                  errorHandlerServiceImports,
                },
                ...options,
              }),
          },
          servicesGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: STRIPE_FASTIFY_STRIPE_TEMPLATES.servicesGroup,
                paths,
                importMapProviders: {
                  configServiceImports,
                  loggerServiceImports,
                },
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
