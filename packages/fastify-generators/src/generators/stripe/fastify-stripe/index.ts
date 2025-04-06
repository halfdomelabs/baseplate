import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  TypescriptCodeExpression,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';
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

export const fastifyStripeGenerator = createGenerator({
  name: 'stripe/fastify-stripe',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, [
        'stripe',
        'fastify-raw-body',
      ]),
    }),
    main: createGeneratorTask({
      dependencies: {
        typescript: typescriptProvider,
        configService: configServiceProvider,
        errorHandlerService: errorHandlerServiceProvider,
        loggerService: loggerServiceProvider,
        fastifyServer: fastifyServerProvider,
      },
      exports: {
        fastifyStripe: fastifyStripeProvider.export(projectScope),
      },
      run({
        typescript,
        configService,
        errorHandlerService,
        loggerService,
        fastifyServer,
      }) {
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
          providers: {
            fastifyStripe: {},
          },
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
                importMappers: [
                  configService,
                  errorHandlerService,
                  loggerService,
                ],
              }),
            );
          },
        };
      },
    }),
  }),
});
