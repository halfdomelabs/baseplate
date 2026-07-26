import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  packageScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
} from '@baseplate-dev/core-generators';
import {
  appRuntimeConfigProvider,
  configServiceImportsProvider,
  configServiceProvider,
  FASTIFY_PACKAGES,
  fastifyServerConfigProvider,
} from '@baseplate-dev/fastify-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { STRIPE_FASTIFY_STRIPE_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

const [
  stripeWebhookSetupTask,
  stripeWebhookConfigProvider,
  stripeWebhookConfigValuesProvider,
] = createConfigProviderTask(
  (t) => ({
    /** Map of Stripe event type -> handler TsCodeFragment (carries its own imports). */
    eventHandlers: t.map<string, TsCodeFragment>(),
  }),
  {
    prefix: 'stripe-webhook',
    configScope: packageScope,
  },
);

export { stripeWebhookConfigProvider };

export const fastifyStripeGenerator = createGenerator({
  name: 'stripe/fastify-stripe',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: STRIPE_FASTIFY_STRIPE_GENERATED.paths.task,
    imports: STRIPE_FASTIFY_STRIPE_GENERATED.imports.task,
    renderers: STRIPE_FASTIFY_STRIPE_GENERATED.renderers.task,
    setup: stripeWebhookSetupTask,
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
          options: tsCodeFragment('{ services }'),
        });
      },
    ),
    appRuntimeConfig: createGeneratorTask({
      dependencies: {
        appRuntimeConfig: appRuntimeConfigProvider,
        configServiceImports: configServiceImportsProvider,
      },
      run({ appRuntimeConfig, configServiceImports }) {
        appRuntimeConfig.services.set(
          'stripe',
          tsCodeFragment(
            'Stripe',
            tsImportBuilder().default('Stripe').typeOnly().from('stripe'),
          ),
        );
        appRuntimeConfig.construction.set('stripe', {
          fragment: TsCodeUtils.template`new ${tsCodeFragment('Stripe', tsImportBuilder().default('Stripe').from('stripe'))}(${configServiceImports.config.fragment()}.STRIPE_SECRET_KEY)`,
        });
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        renderers: STRIPE_FASTIFY_STRIPE_GENERATED.renderers.provider,
        stripeWebhookConfigValues: stripeWebhookConfigValuesProvider,
      },
      run({ renderers, stripeWebhookConfigValues }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.pluginsGroup.render({}));
            await builder.apply(
              renderers.webhookServicesGroup.render({
                variables: {
                  serviceEventHandlers: {
                    TPL_EVENT_HANDLERS: TsCodeUtils.mergeFragmentsAsObject(
                      stripeWebhookConfigValues.eventHandlers,
                    ),
                  },
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
