import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  tsCodeFragment,
  tsImportBuilder,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';
import { configServiceProvider } from '@src/generators/core/config-service/config-service.generator.js';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service/error-handler-service.generator.js';
import { fastifyServerConfigProvider } from '@src/generators/core/fastify-server/fastify-server.generator.js';
import { loggerServiceProvider } from '@src/generators/core/logger-service/logger-service.generator.js';

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
        fastifyServerConfig: fastifyServerConfigProvider,
      },
      exports: {
        fastifyStripe: fastifyStripeProvider.export(projectScope),
      },
      run({
        typescript,
        configService,
        errorHandlerService,
        loggerService,
        fastifyServerConfig,
      }) {
        configService.configFields.set('STRIPE_SECRET_KEY', {
          comment: 'Stripe secret API key',
          validator: tsCodeFragment('z.string().min(1)'),
          seedValue: 'STRIPE_SECRET_KEY',
        });
        configService.configFields.set('STRIPE_ENDPOINT_SECRET', {
          comment: 'Stripe webhook endpoint secret',
          validator: tsCodeFragment('z.string().min(1)'),
          seedValue: 'STRIPE_ENDPOINT_SECRET',
        });
        fastifyServerConfig.plugins.set('rawBodyPlugin', {
          plugin: tsCodeFragment(
            'rawBodyPlugin',
            tsImportBuilder().default('rawBodyPlugin').from('fastify-raw-body'),
          ),
        });
        fastifyServerConfig.plugins.set('stripeWebhookPlugin', {
          plugin: tsCodeFragment(
            'stripeWebhookPlugin',
            tsImportBuilder(['stripeWebhookPlugin']).from(
              '@/src/plugins/stripe-webhook.js',
            ),
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
