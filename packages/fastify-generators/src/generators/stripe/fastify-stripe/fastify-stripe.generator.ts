import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  tsCodeFragment,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';
import {
  configServiceImportsProvider,
  configServiceProvider,
} from '#src/generators/core/config-service/index.js';
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/error-handler-service.generator.js';
import { fastifyServerConfigProvider } from '#src/generators/core/fastify-server/fastify-server.generator.js';
import { loggerServiceImportsProvider } from '#src/generators/core/logger-service/index.js';

import {
  createFastifyStripeImports,
  fastifyStripeImportsProvider,
} from './generated/ts-import-maps.js';
import { STRIPE_FASTIFY_STRIPE_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

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
    configService: createProviderTask(
      configServiceProvider,
      (configService) => {
        configService.configFields.set('STRIPE_SECRET_KEY', {
          comment: 'Stripe secret API key',
          validator: 'z.string().min(1)',
          seedValue: 'STRIPE_SECRET_KEY',
        });
        configService.configFields.set('STRIPE_ENDPOINT_SECRET', {
          comment: 'Stripe webhook endpoint secret',
          validator: 'z.string().min(1)',
          seedValue: 'STRIPE_ENDPOINT_SECRET',
        });
      },
    ),
    fastifyServerConfig: createProviderTask(
      fastifyServerConfigProvider,
      (fastifyServerConfig) => {
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
      },
    ),
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        configServiceImports: configServiceImportsProvider,
        errorHandlerServiceImports: errorHandlerServiceImportsProvider,
        loggerServiceImports: loggerServiceImportsProvider,
      },
      exports: {
        fastifyStripeImports: fastifyStripeImportsProvider.export(projectScope),
      },
      run({
        typescriptFile,
        configServiceImports,
        errorHandlerServiceImports,
        loggerServiceImports,
      }) {
        return {
          providers: {
            fastifyStripeImports: createFastifyStripeImports('@/src/services'),
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: STRIPE_FASTIFY_STRIPE_TS_TEMPLATES.pluginsGroup,
                baseDirectory: '@/src/plugins',
                importMapProviders: {
                  configServiceImports,
                  errorHandlerServiceImports,
                },
              }),
            );
            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: STRIPE_FASTIFY_STRIPE_TS_TEMPLATES.servicesGroup,
                baseDirectory: '@/src/services',
                importMapProviders: {
                  configServiceImports,
                  loggerServiceImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
