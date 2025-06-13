import {
  createNodePackagesTask,
  extractPackageVersions,
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
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/index.js';
import { fastifyServerConfigProvider } from '#src/generators/core/fastify-server/index.js';
import { loggerServiceImportsProvider } from '#src/generators/core/logger-service/index.js';

import { STRIPE_FASTIFY_STRIPE_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export const fastifyStripeGenerator = createGenerator({
  name: 'stripe/fastify-stripe',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: STRIPE_FASTIFY_STRIPE_GENERATED.paths.task,
    imports: STRIPE_FASTIFY_STRIPE_GENERATED.imports.task,
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
        paths: STRIPE_FASTIFY_STRIPE_GENERATED.paths.provider,
      },
      run({
        typescriptFile,
        configServiceImports,
        errorHandlerServiceImports,
        loggerServiceImports,
        paths,
      }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateGroupV2({
                group: STRIPE_FASTIFY_STRIPE_GENERATED.templates.pluginsGroup,
                paths,
                importMapProviders: {
                  configServiceImports,
                  errorHandlerServiceImports,
                },
              }),
            );
            await builder.apply(
              typescriptFile.renderTemplateGroupV2({
                group: STRIPE_FASTIFY_STRIPE_GENERATED.templates.servicesGroup,
                paths,
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
