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
import { compareStrings, quot } from '@baseplate-dev/utils';
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
    /**
     * Additional `AppServices` keys (beyond `stripe`) that registered event
     * handlers close over, e.g. `billing`. Keeps the webhook plugin's and
     * event-handler factory's `Pick<AppServices, ...>` accurate for whichever
     * plugins actually contribute handlers, rather than hardcoding a union
     * that would reference a service no project might register.
     */
    additionalServices: t.array<string>([], { stripDuplicates: true }),
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
          fragment: TsCodeUtils.template`new ${tsCodeFragment('Stripe', tsImportBuilder().default('Stripe').from('stripe'))}(${configServiceImports.getConfig.fragment()}().STRIPE_SECRET_KEY)`,
        });
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        renderers: STRIPE_FASTIFY_STRIPE_GENERATED.renderers.provider,
        stripeWebhookConfigValues: stripeWebhookConfigValuesProvider,
      },
      run({ renderers, stripeWebhookConfigValues }) {
        const servicesKeys = [
          'stripe',
          ...stripeWebhookConfigValues.additionalServices,
        ].toSorted(compareStrings);
        const servicesType = servicesKeys.map((key) => quot(key)).join(' | ');
        const otherServiceKeys = servicesKeys.filter((key) => key !== 'stripe');
        const servicesDestructure =
          otherServiceKeys.length > 0
            ? `const { ${otherServiceKeys.join(', ')} } = services;`
            : '';

        return {
          build: async (builder) => {
            await builder.apply(
              renderers.pluginsGroup.render({
                variables: {
                  pluginsWebhook: {
                    TPL_SERVICES_TYPE: tsCodeFragment(servicesType),
                  },
                },
              }),
            );
            await builder.apply(
              renderers.webhookServicesGroup.render({
                variables: {
                  serviceEventHandlers: {
                    TPL_EVENT_HANDLERS: TsCodeUtils.mergeFragmentsAsObject(
                      stripeWebhookConfigValues.eventHandlers,
                    ),
                    TPL_SERVICES_TYPE: tsCodeFragment(servicesType),
                    TPL_SERVICES_DESTRUCTURE:
                      tsCodeFragment(servicesDestructure),
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
