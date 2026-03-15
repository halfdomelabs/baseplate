import {
  createNodePackagesTask,
  extractPackageVersions,
  tsCodeFragment,
  tsImportBuilder,
} from '@baseplate-dev/core-generators';
import {
  configServiceProvider,
  FASTIFY_PACKAGES,
  fastifyServerConfigProvider,
} from '@baseplate-dev/fastify-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { STRIPE_BILLING_WEBHOOK_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Generator for billing webhook infrastructure.
 *
 * Generates the Stripe webhook plugin and event handler map. Registered as
 * a root child when billing is enabled, alongside the billing-module generator
 * which provides the billing service templates.
 */
export const billingWebhookGenerator = createGenerator({
  name: 'stripe/billing-webhook',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: STRIPE_BILLING_WEBHOOK_GENERATED.paths.task,
    imports: STRIPE_BILLING_WEBHOOK_GENERATED.imports.task,
    renderers: STRIPE_BILLING_WEBHOOK_GENERATED.renderers.task,
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, ['fastify-raw-body']),
    }),
    configService: createProviderTask(
      configServiceProvider,
      (configService) => {
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
        renderers: STRIPE_BILLING_WEBHOOK_GENERATED.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.pluginsGroup.render({}));
            await builder.apply(renderers.servicesGroup.render({}));
          },
        };
      },
    }),
  }),
});
