import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  configServiceImportsProvider,
  errorHandlerServiceImportsProvider,
  loggerServiceImportsProvider,
  prismaGeneratedImportsProvider,
  prismaImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { fastifyStripeImportsProvider } from '#src/stripe/core/generators/fastify-stripe/generated/ts-import-providers.js';

import { STRIPE_BILLING_MODULE_PATHS } from './template-paths.js';
import { STRIPE_BILLING_MODULE_TEMPLATES } from './typed-templates.js';

export interface StripeBillingModuleRenderers {
  moduleGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof STRIPE_BILLING_MODULE_TEMPLATES.moduleGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const stripeBillingModuleRenderers =
  createProviderType<StripeBillingModuleRenderers>(
    'stripe-billing-module-renderers',
  );

const stripeBillingModuleRenderersTask = createGeneratorTask({
  dependencies: {
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    fastifyStripeImports: fastifyStripeImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    paths: STRIPE_BILLING_MODULE_PATHS.provider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    stripeBillingModuleRenderers: stripeBillingModuleRenderers.export(),
  },
  run({
    configServiceImports,
    errorHandlerServiceImports,
    fastifyStripeImports,
    loggerServiceImports,
    paths,
    prismaGeneratedImports,
    prismaImports,
    typescriptFile,
  }) {
    return {
      providers: {
        stripeBillingModuleRenderers: {
          moduleGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: STRIPE_BILLING_MODULE_TEMPLATES.moduleGroup,
                paths,
                importMapProviders: {
                  configServiceImports,
                  errorHandlerServiceImports,
                  fastifyStripeImports,
                  loggerServiceImports,
                  prismaGeneratedImports,
                  prismaImports,
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

export const STRIPE_BILLING_MODULE_RENDERERS = {
  provider: stripeBillingModuleRenderers,
  task: stripeBillingModuleRenderersTask,
};
