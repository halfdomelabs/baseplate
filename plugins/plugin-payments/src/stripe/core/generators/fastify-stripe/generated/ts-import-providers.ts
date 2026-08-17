import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { STRIPE_FASTIFY_STRIPE_PATHS } from './template-paths.js';

export const fastifyStripeImportsSchema = createTsImportMapSchema({
  createStripeEventHandlers: {},
  stripeWebhookPlugin: {},
});

export type FastifyStripeImportsProvider = TsImportMapProviderFromSchema<
  typeof fastifyStripeImportsSchema
>;

export const fastifyStripeImportsProvider =
  createReadOnlyProviderType<FastifyStripeImportsProvider>(
    'fastify-stripe-imports',
  );

const stripeFastifyStripeImportsTask = createGeneratorTask({
  dependencies: {
    paths: STRIPE_FASTIFY_STRIPE_PATHS.provider,
  },
  exports: {
    fastifyStripeImports: fastifyStripeImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        fastifyStripeImports: createTsImportMap(fastifyStripeImportsSchema, {
          createStripeEventHandlers: paths.serviceEventHandlers,
          stripeWebhookPlugin: paths.pluginsWebhook,
        }),
      },
    };
  },
});

export const STRIPE_FASTIFY_STRIPE_IMPORTS = {
  generatorName: '@baseplate-dev/plugin-payments#stripe/fastify-stripe',
  task: stripeFastifyStripeImportsTask,
};
