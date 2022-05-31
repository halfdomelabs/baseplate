import {
  nodeProvider,
  TypescriptCodeExpression,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import * as yup from 'yup';
import { configServiceProvider } from '@src/generators/core/config-service';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service';
import { fastifyServerProvider } from '@src/generators/core/fastify-server';
import { loggerServiceProvider } from '@src/generators/core/logger-service';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
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
    fastifyStripe: fastifyStripeProvider,
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
    }
  ) {
    node.addPackages({
      stripe: '^9.5.0',
      'fastify-raw-body': '^3.2.0',
    });
    configService.getConfigEntries().set('STRIPE_SECRET_KEY', {
      comment: 'Stripe secret API key',
      value: 'yup.string().required()',
      seedValue: 'STRIPE_SECRET_KEY',
    });
    configService.getConfigEntries().set('STRIPE_ENDPOINT_SECRET', {
      comment: 'Stripe webhook endpoint secret',
      value: 'yup.string().required()',
      seedValue: 'STRIPE_ENDPOINT_SECRET',
    });
    fastifyServer.registerPlugin({
      name: 'rawBodyPlugin',
      plugin: new TypescriptCodeExpression(
        'rawBodyPlugin',
        "import rawBodyPlugin from 'fastify-raw-body'"
      ),
    });
    fastifyServer.registerPlugin({
      name: 'stripeWebhookPlugin',
      plugin: new TypescriptCodeExpression(
        'stripeWebhookPlugin',
        "import { stripeWebhookPlugin } from '@/src/plugins/stripe-webhook'"
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
          })
        );
      },
    };
  },
});

export default FastifyStripeGenerator;
