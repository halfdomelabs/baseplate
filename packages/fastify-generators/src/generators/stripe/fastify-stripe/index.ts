import {
  nodeProvider,
  projectScope,
  TypescriptCodeExpression,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { configServiceProvider } from '@src/generators/core/config-service/index.js';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service/index.js';
import { fastifyServerProvider } from '@src/generators/core/fastify-server/index.js';
import { loggerServiceProvider } from '@src/generators/core/logger-service/index.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export type FastifyStripeProvider = unknown;

export const fastifyStripeProvider =
  createProviderType<FastifyStripeProvider>('fastify-stripe');

const FastifyStripeGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    typescript: typescriptProvider,
    configService: configServiceProvider,
    errorHandlerService: errorHandlerServiceProvider,
    loggerService: loggerServiceProvider,
    fastifyServer: fastifyServerProvider,
  },
  exports: {
    fastifyStripe: fastifyStripeProvider.export(projectScope),
  },
  createGenerator(
    descriptor,
    {
      node,
      typescript,
      configService,
      errorHandlerService,
      loggerService,
      fastifyServer,
    },
  ) {
    node.addPackages({
      stripe: '14.5.0',
      'fastify-raw-body': '5.0.0',
    });
    configService.getConfigEntries().set('STRIPE_SECRET_KEY', {
      comment: 'Stripe secret API key',
      value: 'z.string().min(1)',
      seedValue: 'STRIPE_SECRET_KEY',
    });
    configService.getConfigEntries().set('STRIPE_ENDPOINT_SECRET', {
      comment: 'Stripe webhook endpoint secret',
      value: 'z.string().min(1)',
      seedValue: 'STRIPE_ENDPOINT_SECRET',
    });
    fastifyServer.registerPlugin({
      name: 'rawBodyPlugin',
      plugin: new TypescriptCodeExpression(
        'rawBodyPlugin',
        "import rawBodyPlugin from 'fastify-raw-body'",
      ),
    });
    fastifyServer.registerPlugin({
      name: 'stripeWebhookPlugin',
      plugin: new TypescriptCodeExpression(
        'stripeWebhookPlugin',
        "import { stripeWebhookPlugin } from '@/src/plugins/stripe-webhook.js'",
      ),
    });

    return {
      getProviders: () => ({
        fastifyStripe: {},
      }),
      build: async (builder) => {
        await builder.apply(
          typescript.createCopyFilesAction({
            destinationBaseDirectory: 'src',
            paths: [
              'plugins/stripe-webhook.int.test.ts',
              'plugins/stripe-webhook.ts',
              'services/stripe-events.ts',
              'services/stripe.ts',
            ],
            importMappers: [configService, errorHandlerService, loggerService],
          }),
        );
      },
    };
  },
});

export default FastifyStripeGenerator;
