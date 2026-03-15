import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  configServiceImportsProvider,
  errorHandlerServiceImportsProvider,
  loggerServiceImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { fastifyStripeImportsProvider } from '#src/stripe/core/generators/fastify-stripe/generated/ts-import-providers.js';
import { billingModuleImportsProvider } from '#src/stripe/core/generators/stripe/billing-module/generated/ts-import-providers.js';

import { STRIPE_BILLING_WEBHOOK_PATHS } from './template-paths.js';
import { STRIPE_BILLING_WEBHOOK_TEMPLATES } from './typed-templates.js';

export interface StripeBillingWebhookRenderers {
  pluginsGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof STRIPE_BILLING_WEBHOOK_TEMPLATES.pluginsGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  servicesGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof STRIPE_BILLING_WEBHOOK_TEMPLATES.servicesGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const stripeBillingWebhookRenderers =
  createProviderType<StripeBillingWebhookRenderers>(
    'stripe-billing-webhook-renderers',
  );

const stripeBillingWebhookRenderersTask = createGeneratorTask({
  dependencies: {
    billingModuleImports: billingModuleImportsProvider,
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    fastifyStripeImports: fastifyStripeImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    paths: STRIPE_BILLING_WEBHOOK_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    stripeBillingWebhookRenderers: stripeBillingWebhookRenderers.export(),
  },
  run({
    billingModuleImports,
    configServiceImports,
    errorHandlerServiceImports,
    fastifyStripeImports,
    loggerServiceImports,
    paths,
    typescriptFile,
  }) {
    return {
      providers: {
        stripeBillingWebhookRenderers: {
          pluginsGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: STRIPE_BILLING_WEBHOOK_TEMPLATES.pluginsGroup,
                paths,
                importMapProviders: {
                  configServiceImports,
                  errorHandlerServiceImports,
                  fastifyStripeImports,
                  loggerServiceImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          servicesGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: STRIPE_BILLING_WEBHOOK_TEMPLATES.servicesGroup,
                paths,
                importMapProviders: {
                  billingModuleImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const STRIPE_BILLING_WEBHOOK_RENDERERS = {
  provider: stripeBillingWebhookRenderers,
  task: stripeBillingWebhookRenderersTask,
};
