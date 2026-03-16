import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { configServiceImportsProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { STRIPE_FASTIFY_STRIPE_PATHS } from './template-paths.js';
import { STRIPE_FASTIFY_STRIPE_TEMPLATES } from './typed-templates.js';

export interface StripeFastifyStripeRenderers {
  servicesGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof STRIPE_FASTIFY_STRIPE_TEMPLATES.servicesGroup
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
    configServiceImports: configServiceImportsProvider,
    paths: STRIPE_FASTIFY_STRIPE_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    stripeFastifyStripeRenderers: stripeFastifyStripeRenderers.export(),
  },
  run({ configServiceImports, paths, typescriptFile }) {
    return {
      providers: {
        stripeFastifyStripeRenderers: {
          servicesGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: STRIPE_FASTIFY_STRIPE_TEMPLATES.servicesGroup,
                paths,
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

export const STRIPE_FASTIFY_STRIPE_RENDERERS = {
  provider: stripeFastifyStripeRenderers,
  task: stripeFastifyStripeRenderersTask,
};
